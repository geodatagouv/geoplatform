const mongoose = require('mongoose')
const {pick} = require('lodash')

const {Http404} = require('../errors')
const am = require('../middlewares/async')

const Service = mongoose.model('Service')
const ServiceSync = mongoose.model('ServiceSync')

exports.service = function (req, res, next, id) {
  Service
    .findById(id)
    .exec((err, service) => {
      if (err) {
        return next(err)
      }
      if (!service) {
        return next(new Http404())
      }
      req.service = service
      next()
    })
}

exports.sync = function (req, res, next, id) {
  ServiceSync
    .findById(id)
    .where('service').equals(req.service.id)
    .exec((err, serviceSync) => {
      if (err) {
        return next(err)
      }
      if (!serviceSync) {
        return next(new Http404())
      }
      req.serviceSync = serviceSync
      next()
    })
}

/*
** Actions
*/
exports.list = am(async (req, res) => {
  const query = Service.find()
  if (req.params.protocol) {
    query.where('protocol').equals(req.params.protocol)
  }

  const services = await query.exec()

  res.send(services)
})

exports.create = am(async (req, res) => {
  const service = new Service()
  service.set(pick(req.body, 'name', 'location', 'protocol'))
  service.addedBy = req.user

  await service.save()

  res.send(service)
})

exports.show = (req, res) => {
  res.send(req.service)
}

exports.handleSync = am(async (req, res) => {
  await req.service.doSync(0)

  res.send(req.service)
})

exports.listSyncs = am(async (req, res) => {
  const syncs = await ServiceSync.collection.find({
    service: req.service._id,
    status: {
      $ne: 'queued'
    }
  }, {
    sort: {
      finished: -1
    },
    projection: {
      finished: 1,
      itemsFound: 1,
      status: 1,
      service: 1
    },
    limit: 10
  }).toArray()

  res.send(syncs)
})

exports.showSync = (req, res) => {
  res.send(req.serviceSync)
}

exports.syncAllByProtocol = am(async (req, res) => {
  const services = await Service
    .find()
    .where('protocol').equals(req.params.protocol)
    .exec()

  await Promise.all(
    services.map(service => service.doSync(0))
  )

  res.send({
    status: 'ok',
    services: services.length
  })
})
