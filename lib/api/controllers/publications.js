const mongoose = require('mongoose')

const {Http404} = require('../errors')
const am = require('../middlewares/async')

const Publication = mongoose.model('Publication')

exports.publishOrUpdate = am(async (req, res) => {
  const {recordId} = req.params
  const {remoteId, remoteUrl} = req.body

  let publication = await Publication.findOne({
    recordId,
    target: 'dgv'
  }).exec()

  if (!publication) {
    publication = new Publication({
      recordId,
      target: 'dgv'
    })
  }

  await publication.set({
    remoteId,
    remoteUrl
  }).save()

  res.send(publication)
})

exports.show = am(async (req, res) => {
  const {recordId} = req.params

  const publication = await Publication.collection.findOne({
    recordId,
    target: 'dgv'
  }, {
    projection: {
      _id: 0,
      updatedAt: 1,
      createdAt: 1,
      remoteId: 1,
      remoteUrl: 1
    }
  })

  if (!publication) {
    throw new Http404()
  }

  res.send(publication)
})

exports.list = am(async (req, res) => {
  const {recordId} = req.params

  const publications = await Publication.collection.find({
    recordId
  }, {
    projection: {
      _id: 0,
      updatedAt: 1,
      createdAt: 1,
      remoteId: 1,
      remoteUrl: 1,
      target: 1
    }
  }).toArray()

  res.send(publications)
})

exports.listAll = am(async (req, res) => {
  const publications = await Publication.collection.find({
    target: 'dgv'
  }, {
    projection: {
      _id: 0,
      updatedAt: 1,
      createdAt: 1,
      recordId: 1,
      remoteId: 1,
      remoteUrl: 1
    }
  }).toArray()

  res.send(publications)
})

exports.unpublish = am(async (req, res) => {
  const {recordId} = req.params

  const publication = await Publication.findOne({
    recordId,
    target: 'dgv'
  }).exec()

  if (!publication) {
    throw new Http404()
  }

  await publication.delete()

  res.status(204).send()
})
