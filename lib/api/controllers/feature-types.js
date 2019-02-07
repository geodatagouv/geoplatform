'use strict'

const mongoose = require('mongoose')

const {Http404} = require('../errors')
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
