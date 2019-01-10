const mongoose = require('mongoose')
const {get} = require('lodash')
const debug = require('debug')('geoplatform:jobs:index-record')

const elastic = require('../../utils/elastic')

const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const Catalog = mongoose.model('Catalog')
const Publication = mongoose.model('Publication')

const opendataLicenses = ['lov2', 'odc-odbl']

function getType(type) {
  switch (type) {
    case 'dataset':
    case 'series':
      return 'dataset'

    case 'map':
    case 'interactiveMap':
      return 'map'

    case 'nonGeographicDataset':
      return 'nonGeographicDataset'

    case 'service':
      return 'service'

    default:
      return type ? 'other' : 'none'
  }
}

function getRepresentationType(representationType) {
  switch (representationType) {
    case 'grid':
    case 'raster':
      return 'grid'

    case 'vector':
      return 'vector'

    default:
      return representationType ? 'other' : 'none'
  }
}

async function getCatalogs(catalogIds) {
  const catalogs = await Catalog.collection.find({
    _id: {
      $in: catalogIds
    }
  }, {
    projection: {
      name: 1
    }
  }).toArray()

  return catalogs.map(catalog => catalog.name)
}

function getDistributionFormats(resources) {
  const formats = new Set()

  for (const resource of resources) {
    switch (resource.type) {
      case 'download':
        if (resource.downloads.some(d => d.resourceType !== 'other')) {
          formats.add('file')
        }
        break

      case 'service':
        if (resource.serviceType === 'wfs' && resource.features.some(f => f.available)) {
          formats.add('wfs')
        }
        break

      default:
        break
    }
  }

  return [...formats]
}

async function isPublished(recordId) {
  return await Publication.countDocuments({
    recordId
  }) !== 0
}

async function indexRecord(recordId) {
  const record = await ConsolidatedRecord.findOne({recordId}).exec()

  if (!record) {
    debug(`Record with id ${recordId} was n ot found`)
    return false
  }

  debug(`Indexing record ${recordId}`)

  const model = {
    title: record.metadata.title,
    description: record.metadata.description,
    lineage: record.metadata.lineage,
    createdAt: record.createdAt,
    revisionDate: record.metadata.revisionDate || record.metadata.creationDate,

    type: getType(record.metadata.type),
    representationType: getRepresentationType(record.metadata.spatialRepresentationType),
    metadataType: record.metadata.metadataType,

    inspireTheme: get(record, 'metadata.inspireTheme.id'),
    topicCategory: record.metadata.topicCategory,
    organizations: record.organizations,
    keywords: record.metadata.keywords,
    catalogs: await getCatalogs(record.catalogs),
    license: record.metadata.license,
    distributionFormats: getDistributionFormats(record.resources)
  }

  await elastic.index('records', recordId, {
    ...model,

    // Booleans
    downloadable: model.distributionFormats.length > 0,
    opendata: opendataLicenses.includes(model.license),
    published: await isPublished(recordId)
  })
}

exports.handler = ({data: {recordId}}) => indexRecord(recordId)
