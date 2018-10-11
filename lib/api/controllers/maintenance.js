const mongoose = require('mongoose')
const {isNumber} = require('lodash')
const {enqueue} = require('delayed-jobs')

const am = require('../middlewares/async')

const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const Catalog = mongoose.model('Catalog')

const consolidateRecords = am(async (req, res) => {
  const reqLimit = parseInt(req.query.limit, 10)
  const limit = isNumber(reqLimit) && reqLimit > 0 ? reqLimit : 100

  const {count} = await ConsolidatedRecord.consolidateMany({limit})

  res.status(202).send({task: 'consolidate-records', count})
})

const computeCatalogsMetrics = am(async (req, res) => {
  const catalogs = await Catalog.collection.find({}, {
    projection: {
      _id: 1
    }
  }).toArray()

  await Promise.all(
    catalogs.map(({_id}) => {
      return enqueue('compute-catalog-metrics', {
        catalogId: _id
      })
    })
  )

  res.send({
    task: 'compute-catalogs-metrics', count: catalogs.length
  })
})

module.exports = {consolidateRecords, computeCatalogsMetrics}
