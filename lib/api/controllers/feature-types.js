const mongoose = require('mongoose')

const {Http404} = require('../errors')
const am = require('../middlewares/async')

const FeatureType = mongoose.model('FeatureType')

/* Middlewares */
exports.featureType = async (req, res, next, id) => {
  try {
    const featureType = await FeatureType.findOne({
      service: req.params.serviceId,
      name: id
    }).exec()

    if (!featureType) {
      return next(new Http404())
    }

    req.featureType = featureType
    next()
  } catch (error) {
    next(error)
  }
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
  res.send({
    ...req.featureType.toJSON(),
    serviceLocation: req.service.location
  })
}
