const mongoose = require('mongoose')
const debug = require('debug')('geoplatform:jobs:consolidate-record')
const {uniq} = require('lodash')
const {enqueue} = require('bull-manager')

const sentry = require('../../../lib/utils/sentry')

const {computeFacets} = require('../../search/facets')
const {convertFromIso, convertFromDublinCore} = require('../../metadata')
const {resolveLinks, retrieveResourcesFromLinks} = require('./links')
const {resolveFeatureTypes, retrieveResourcesFromFeatureTypes} = require('./feature-types')

const RecordRevision = mongoose.model('RecordRevision')
const CatalogRecord = mongoose.model('CatalogRecord')
const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const Publication = mongoose.model('Publication')

async function consolidateRecord({data: {recordId, freshness}}) {
  const record = await getConsolidatedRecord(recordId)

  if (record.isFresh(freshness)) {
    debug('Record is fresh enough, not consolidating')
    return
  }

  try {
    const recordRevision = await RecordRevision.findOne({recordId, featured: true}).exec()
    if (!recordRevision) {
      debug(`Featured record not found for ${recordId}, electing new record`)
      return enqueue('elect-record', recordId, {
        recordId
      })
    }

    debug(`Consolidating record ${recordId}`)

    const {catalogs, publications} = {
      catalogs: await getCatalogs(recordId),
      publications: await getPublications(recordId)
    }

    const metadata = createDatasetFromRecord(recordRevision)
    const organizations = uniq(metadata.contacts.map(contact => contact.organizationName))

    record
      .set('recordHash', recordRevision.recordHash)
      .set('revisionDate', recordRevision.revisionDate)
      .set('metadata', metadata)

    record.set('organizations', organizations)

    const links = await resolveLinks(metadata.links, record._links)
    record.set('_links', links)

    const featureTypes = await resolveFeatureTypes(metadata.featureTypes)
    record.set('_featureTypes', featureTypes)

    record.set('resources', [
      ...await retrieveResourcesFromLinks(links),
      ...await retrieveResourcesFromFeatureTypes(featureTypes)
    ])

    await record
      .set('catalogs', catalogs.map(catalog => catalog._id))
      .set('facets', computeFacets(record, {
        catalogs,
        publications
      }))
      .save()
  } catch (error) {
    debug(`Failed consolidating record ${recordId}`)
    sentry.captureException(error)
  }
}

async function getCatalogs(recordId) {
  const catalogRecords = await CatalogRecord
    .find({recordId})
    .populate('catalog', 'name')
    .lean()
    .exec()

  return catalogRecords.map(catalogRecord => catalogRecord.catalog)
}

async function getConsolidatedRecord(recordId) {
  const record = await ConsolidatedRecord.findOne({recordId}).exec()
  return record || new ConsolidatedRecord({recordId})
}

function getPublications(datasetId) {
  return Publication.find({recordId: datasetId}).exec()
}

function createDatasetFromRecord(recordRevision) {
  if (recordRevision.recordType === 'Record') {
    return convertFromDublinCore(recordRevision.content)
  }
  if (recordRevision.recordType === 'MD_Metadata') {
    return convertFromIso(recordRevision.content)
  }
  throw new Error('Not supported record type: ' + recordRevision.recordType)
}

exports.handler = consolidateRecord
