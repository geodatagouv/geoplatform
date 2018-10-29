'use strict'

const mongoose = require('mongoose')
const {strRight} = require('underscore.string')

const {Http400, Http404} = require('../errors')
const am = require('../middlewares/async')

const FeatureType = mongoose.model('FeatureType')

/* Middlewares */
exports.featureType = (req, res, next, id) => {
  FeatureType
    .findOne({service: req.params.serviceId, name: id})
    .exec((err, featureType) => {
      if (err) {
        return next(err)
      }
      if (!featureType) {
        return next(new Http404())
      }
      req.featureType = featureType
      next()
    })
}

/* Actions */
exports.list = am(async (req, res) => {
  const featureTypes = await FeatureType
    .find({service: req.service._id})
    .select({service: 0})
    .exec()

  res.send(featureTypes)
})

exports.show = (req, res) => {
  res.send(req.featureType)
}

exports.prepateFeatureTypeDownload = (req, res, next) => {
  if (req.service.protocol !== 'wfs') {
    return next(new Http400('The specified protocol is not supported'))
  }

  if (!req.featureType.available) {
    return next(new Http404(`FeatureType '${req.params.typeName}' no more available on this service`))
  }

  req.ogr2ogr = {}
  req.ogr2ogr.layerName = strRight(req.featureType.name, ':')
  req.ogr2ogr.src = 'WFS:' + req.service.location + (req.service.location.indexOf('?') >= 0 ? '&' : '?')

  next()
}
