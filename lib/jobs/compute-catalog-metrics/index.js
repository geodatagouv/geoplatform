const mongoose = require('mongoose')
const moment = require('moment')
const debug = require('debug')('geoplatform:jobs:compute-catalog-metrics')

const search = require('../../search/elastic')

const Catalog = mongoose.model('Catalog')
const CatalogRecord = mongoose.model('CatalogRecord')

function getBucketValue(value) {
  switch (value.key_as_string) {
    case 'true':
      return 'yes'

    case 'false':
      return 'no'

    default:
      return value.key
  }
}

function countBy(result, property) {
  const aggregation = result.aggregations[property]

  if (aggregation) {
    return aggregation.buckets.reduce((counts, bucket) => {
      counts[getBucketValue(bucket)] = bucket.doc_count
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
      catalog: catalog.name,
      limit: 1
    }, {
      excludeServices: true
    }),

    search({
      catalog: catalog.name,
      limit: 1
    }),

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
      totalCount: records.hits.total,
      counts: {},
      partitions: {
        recordType: countBy(records, 'type')
      }
    },
    datasets: {
      totalCount: datasets.hits.total,
      counts: {
        organizations: countBy(datasets, 'organizations')
      },
      partitions: {
        dataType: countBy(datasets, 'representationType'),
        metadataType: countBy(datasets, 'metadataType'),
        openness: countBy(datasets, 'opendata'),
        download: countBy(datasets, 'downloadable')
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
