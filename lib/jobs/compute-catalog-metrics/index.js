const mongoose = require('mongoose')
const moment = require('moment')
const debug = require('debug')('geoplatform:jobs:compute-catalog-metrics')

const search = require('../../search')

const Catalog = mongoose.model('Catalog')
const CatalogRecord = mongoose.model('CatalogRecord')

function countBy(result, property) {
  if (result.facets[property]) {
    return result.facets[property].reduce((counts, facet) => {
      counts[facet.value] = facet.count
      return counts
    }, {})
  }
}

async function computeCatalogMetrics({data: {catalogId, force = false}}) {
  const catalog = await Catalog.collection.findOne({
    _id: new mongoose.mongo.ObjectId(catalogId)
  }, {
    projection: {
      name: 1,
      'metrics.updatedAt': 1
    }
  })

  if (!catalog) {
    debug(`Could not find catalog with id ${catalogId}`)
    return
  }

  if (!force && catalog.metrics && moment().diff(catalog.metrics.updatedAt, 'minutes') < 15) {
    debug(`Metrics were computed less than 15 minutes ago for catalog ${catalog.name}`)
    return
  }

  const [datasets, records, mostRecentRecord] = await Promise.all([
    search({
      resultParts: 'facets,count',
      type: 'dataset'
    }, catalog.name),

    search({
      resultParts: 'facets,count'
    }, catalog.name),

    CatalogRecord.collection.findOne({
      catalog: catalog._id,
      revisionDate: {
        $exists: true
      }
    }, {
      sort: {
        revisionDate: -1
      },
      projection: {
        revisionDate: 1
      }
    })
  ])

  const metrics = {
    records: {
      totalCount: records.count,
      counts: {
        organizations: countBy(records, 'organization'),
        keywords: countBy(records, 'keyword')
      },
      partitions: {
        recordType: countBy(records, 'type'),
        metadataType: countBy(datasets, 'metadataType')
      }
    },
    datasets: {
      totalCount: datasets.count,
      counts: {},
      partitions: {
        dataType: countBy(datasets, 'representationType'),
        openness: countBy(datasets, 'opendata'),
        download: countBy(datasets, 'availability')
      }
    },
    mostRecentRevisionDate: mostRecentRecord ? mostRecentRecord.revisionDate : null,
    updatedAt: new Date()
  }

  await Catalog.collection.updateOne({
    _id: catalog._id
  }, {
    $set: {
      metrics
    }
  })

  debug(`Updated metrics for catalog ${catalog.name}`)
}

exports.handler = computeCatalogMetrics
