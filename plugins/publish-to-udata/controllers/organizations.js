const mongoose = require('mongoose')
const {pick} = require('lodash')

const am = require('../../../lib/api/middlewares/async')
const {Http404} = require('../../../lib/api/errors')

const {getOrganization} = require('../udata')

const Organization = mongoose.model('Organization')
const Producer = mongoose.model('Producer')

const EDITABLE_FIELDS = ['sourceCatalogs']

/* Params */

exports.fetch = async (req, res, next, id) => {
  try {
    const [organization, producers] = await Promise.all([
      Organization.findById(id),
      Producer.find({associatedTo: id}).select('-associatedTo').exec()
    ])

    if (organization) {
      req.organization = organization
      req.organization.producers = producers
    } else {
      req.organization = new Organization({_id: id})
    }

    next()
  } catch (error) {
    next(error)
  }
}

/* Actions */

exports.show = am((req, res) => {
  if (!req.organization) {
    throw new Http404()
  }

  const organization = req.organization.toObject()
  organization.producers = req.organization.producers

  res.send(organization)
})

exports.createOrUpdate = am(async (req, res) => {
  await req.organization
    .set(pick(req.body, ...EDITABLE_FIELDS))
    .save()

  await req.organization.enable(req.user.accessToken)

  res.send(req.organization)
})

exports.list = am(async (req, res) => {
  const organizations = await Organization.find().exec()
  res.send(organizations)
})

exports.showProfile = am(async (req, res) => {
  const organization = await getOrganization(req.params.organizationId)
  res.send(organization)
})
