'use strict'

const mongoose = require('mongoose')
const {pick} = require('lodash')
const Promise = require('bluebird')
const {getOrganization} = require('../udata')

const Organization = mongoose.model('Organization')
const Producer = mongoose.model('Producer')

const EDITABLE_FIELDS = ['sourceCatalogs']

exports.fetch = function (req, res, next, id) {
  Promise.join(
    Organization.findById(id),
    Producer.find({associatedTo: id}).select('-associatedTo').exec(),

    (organization, producers) => {
      if (!organization) {
        req.organization = new Organization({_id: id})
      } else {
        req.organization = organization
        req.organization.producers = producers
      }
      next()
    }
  ).catch(next)
}

exports.show = function (req, res) {
  if (!req.organization) {
    return res.sendStatus(404)
  }
  const organization = req.organization.toObject()
  organization.producers = req.organization.producers
  res.send(organization)
}

exports.createOrUpdate = async function (req, res, next) {
  try {
    await req.organization
      .set(pick(req.body, ...EDITABLE_FIELDS))
      .save()

    await req.organization.enable(req.user.accessToken)

    res.send(req.organization)
  } catch (error) {
    console.log('ERROR', error)
    next(error)
  }
}

exports.list = function (req, res, next) {
  Organization.find().exec((err, organizations) => {
    if (err) {
      return next(err)
    }
    res.send(organizations)
  })
}

exports.showProfile = function (req, res, next) {
  getOrganization(req.params.organizationId)
    .then(organization => res.send(organization))
    .catch(next)
}
