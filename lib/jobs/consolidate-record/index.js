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

    const catalogs = await getCatalogs(recordId)
    const metadata = createDatasetFromRecord(recordRevision, catalogs)
    const organizations = uniq(metadata.contacts.map(contact => contact.organizationName))

    record
      .set('recordHash', recordRevision.recordHash)
      .set('revisionDate', recordRevision.revisionDate)
      .set('metadata', metadata)

    record.set('organizations', organizations)

    const links = await resolveLinks(metadata.links, record._links)
    record.set('_links', links)

    const featureTypes = await resolveFeatureTypes(recordId, metadata.featureTypes)

    record.set('resources', [
      ...await retrieveResourcesFromLinks(links),
      ...await retrieveResourcesFromFeatureTypes(featureTypes)
    ])

    await record
      .set('catalogs', catalogs)
      .set('facets', computeFacets(record))
      .save()
  } catch (error) {
    debug(`Failed consolidating record ${recordId}`)
    sentry.captureException(error)
  }

  await enqueue('index-record', 'consolidated', {
    recordId
  })
}

async function getCatalogs(recordId) {
  const catalogRecords = await CatalogRecord.collection.find({
    recordId
  }, {
    projection: {
      catalog: 1
    }
  }).toArray()

  return catalogRecords.map(catalogRecord => catalogRecord.catalog)
}

async function getConsolidatedRecord(recordId) {
  const record = await ConsolidatedRecord.findOne({recordId}).exec()
  return record || new ConsolidatedRecord({recordId})
}

function createDatasetFromRecord(recordRevision, catalogs) {
  switch (recordRevision.recordType) {
    case 'Record':
      return convertFromDublinCore(recordRevision.content, catalogs)

    case 'MD_Metadata':
      return convertFromIso(recordRevision.content, catalogs)

    default:
      throw new Error(`Not supported record type: ${recordRevision.recordType}`)
  }
}

exports.handler = consolidateRecord
