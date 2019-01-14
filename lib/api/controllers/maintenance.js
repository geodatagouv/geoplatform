const mongoose = require('mongoose')
const {enqueue} = require('bull-manager')

const elastic = require('../../utils/elastic')
const am = require('../middlewares/async')

const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const Catalog = mongoose.model('Catalog')
const CatalogRecord = mongoose.model('CatalogRecord')

const electRecords = am(async (req, res) => {
  const recordIds = await CatalogRecord.collection.distinct('recordId', {}, {
    projection: {
      recordId: 1
    }
  })

  for (const recordId of recordIds) {
    enqueue('elect-record', recordId, {
      recordId
    })
  }

  res.status(202).send({
    task: 'elect-record',
    count: recordIds.length
  })
})

const recreateIndex = am(async (req, res) => {
  await elastic.client.indices.delete({
    index: 'records'
  })

  await elastic.createIndices()

  res.status(201).send({
    task: 'recreate-index',
    success: true
  })
})

const indexRecords = am((req, res, next) => {
  let length = 0

  ConsolidatedRecord
    .find({})
    .select({
      recordId: 1
    })
    .cursor()
    .on('data', ({recordId}) => {
      ++length
      enqueue('index-record', recordId, {
        recordId
      })
    })
    .on('error', error => {
      next(error)
    })
    .on('end', () => {
      res.status(202).send({
        task: 'index-record',
        count: length
      })
    })
})

const consolidateRecords = am(async (req, res) => {
  let limit = 100
  let freshness

  if (req.query.limit) {
    try {
      limit = parseInt(req.query.limit, 10)
      if (limit <= 0) {
        limit = 100
      }
    } catch (error) {}
  }

  if (req.query.freshness) {
    try {
      freshness = parseInt(req.query.freshness, 10)
    } catch (error) {}
  }

  const {count} = await ConsolidatedRecord.consolidateMany({freshness, limit})

  res.status(202).send({
    task: 'consolidate-records',
    count
  })
})

const computeCatalogsMetrics = am(async (req, res) => {
  const catalogs = await Catalog.collection.find({}, {
    projection: {
      _id: 1,
      name: 1
    }
  }).toArray()

  for (const {_id, name} of catalogs) {
    enqueue('compute-catalog-metrics', name, {
      catalogId: _id,
      force: true
    })
  }

  res.status(202).send({
    task: 'compute-catalogs-metrics',
    count: catalogs.length
  })
})

module.exports = {
  electRecords,
  consolidateRecords,
  recreateIndex,
  indexRecords,
  computeCatalogsMetrics
}
