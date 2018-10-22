const mongoose = require('mongoose')
const {isNumber} = require('lodash')
const {enqueue} = require('bull-manager')

const am = require('../middlewares/async')

const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const Catalog = mongoose.model('Catalog')
const RecordRevision = mongoose.model('CatalogRecord')

const electRecords = am(async (req, res) => {
  const recordIds = await RecordRevision.collection.distinct('recordId', {}, {
    projection: {
      recordId: 1
    }
  })

  for (const recordId of recordIds) {
    enqueue('elect-record', {
      recordId
    })
  }

  res.status(202).send({
    task: 'elect-record',
    count: recordIds.length
  })
})

const consolidateRecords = am(async (req, res) => {
  const reqLimit = parseInt(req.query.limit, 10)
  const limit = isNumber(reqLimit) && reqLimit > 0 ? reqLimit : 100

  const {count} = await ConsolidatedRecord.consolidateMany({limit})

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
    enqueue('compute-catalog-metrics', {
      name,
      catalogId: _id,
      force: true
    })
  }

  res.status(202).send({
    task: 'compute-catalogs-metrics',
    count: catalogs.length
  })
})

module.exports = {electRecords, consolidateRecords, computeCatalogsMetrics}
