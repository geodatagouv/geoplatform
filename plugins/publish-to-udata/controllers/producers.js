const mongoose = require('mongoose')

const am = require('../../../lib/api/middlewares/async')
const {Http404} = require('../../../lib/api/errors')

const Producer = mongoose.model('Producer')
const Record = mongoose.model('ConsolidatedRecord')

/* Params */

exports.fetch = async (req, res, next, id) => {
  try {
    const producer = await Producer.findById(id)
    if (!producer) {
      throw new Http404()
    }

    req.producer = producer

    next()
  } catch (error) {
    next(error)
  }
}

/* Actions */

exports.list = am(async (req, res) => {
  const producers = await Producer.find().lean().exec()
  res.send(producers)
})

exports.associate = am(async (req, res) => {
  const producer = await Producer.create({
    _id: req.body._id,
    associatedTo: req.organization._id
  })

  res.send(producer)
})

exports.dissociate = am(async (req, res) => {
  if (!req.producer.associatedTo.equals(req.organization._id)) {
    throw new Http404()
  }

  await Producer.findByIdAndRemove(req.producer._id)

  res.status(204).end()
})

const facetEligibilityCondition = {
  $all: [
    {$elemMatch: {name: 'availability', value: 'yes'}},
    {$elemMatch: {name: 'opendata', value: 'yes'}}
  ]
}

exports.listByOrganization = am(async (req, res) => {
  const eligibleProducerNames = await Record.distinct('organizations', {
    facets: facetEligibilityCondition,
    catalogs: {$in: req.organization.sourceCatalogs}
  }).exec()

  const producers = await Producer.find({_id: {$in: eligibleProducerNames}}).lean().exec()
  const associatedProducersNames = producers.map(ap => ap._id)

  for (const eligibleProducerName of eligibleProducerNames) {
    if (!associatedProducersNames.includes(eligibleProducerName)) {
      producers.push({
        _id: eligibleProducerName
      })
    }
  }

  res.send(producers)
})
