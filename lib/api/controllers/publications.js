'use strict'

const mongoose = require('mongoose')
const {pick} = require('lodash')

const {Http404} = require('../errors')
const am = require('../middlewares/async')

const Publication = mongoose.model('Publication')

/* Params */

exports.publication = async (req, res, next, publicationTarget) => {
  const {recordId} = req.params

  try {
    const publication = await Publication.findOne({recordId, target: publicationTarget}).exec()
    req.publication = publication

    next()
  } catch (error) {
    next(error)
  }
}

/* Actions */

exports.publishOrUpdate = am(async (req, res) => {
  const {recordId, publicationTarget} = req.params
  const {remoteId, remoteUrl} = req.body

  if (!req.publication) {
    req.publication = new Publication({recordId, target: publicationTarget})
  }

  const publication = await req.publication.set({remoteId, remoteUrl}).save()

  res.send(publication)
})

exports.show = (req, res) => {
  const FIELDS = ['updatedAt', 'createdAt', 'remoteId', 'remoteUrl']

  if (!req.publication) {
    throw new Http404()
  }

  res.send(pick(req.publication, ...FIELDS))
}

exports.list = am(async (req, res) => {
  const {recordId} = req.params
  const FIELDS = ['updatedAt', 'createdAt', 'remoteId', 'remoteUrl', 'target']

  const publications = await Publication.find({recordId}).exec()

  res.send(publications.map(p => pick(p, ...FIELDS)))
})

exports.listAll = am(async (req, res) => {
  const publications = await Publication
    .find({target: req.params.target})
    .select({__v: 0, _id: 0, target: 0})
    .lean()
    .exec()

  res.send(publications)
})

exports.unpublish = am(async (req, res) => {
  if (!req.publication) {
    throw new Http404()
  }

  await req.publication.delete()

  res.status(204).send()
})
