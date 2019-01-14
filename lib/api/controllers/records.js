const mongoose = require('mongoose')
const {clone} = require('lodash')

const search = require('../../search')
const elasticSearch = require('../../search/elastic')

const {Http404} = require('../errors')
const am = require('../middlewares/async')
const proxyThumbnail = require('../middlewares/thumbnail-proxy')

const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const RecordRevision = mongoose.model('RecordRevision')

/*
** Middlewares
*/
exports.record = function (req, res, next, id) {
  ConsolidatedRecord
    .findOne({recordId: id})
    .exec((err, record) => {
      if (err) {
        return next(err)
      }

      if (!record) {
        return next(new Http404())
      }

      req.record = record
      next()
    })
}

exports.recordRevision = (req, res, next, id) => {
  RecordRevision
    .findOne({recordId: req.record.recordId, recordHash: id})
    .exec((err, recordRevision) => {
      if (err) {
        return next(err)
      }

      if (!recordRevision) {
        return next(new Http404())
      }

      req.recordRevision = recordRevision
      next()
    })
}

/*
** Actions
*/
exports.show = function (req, res) {
  res.send(req.record)
}

exports.showBestRevision = am(async (req, res) => {
  const recordRevision = await RecordRevision
    .findOne({recordId: req.record.recordId, recordHash: req.record.recordHash})
    .exec()

  if (!recordRevision) {
    throw new Http404()
  }

  res.send(recordRevision)
})

exports.showRevision = (req, res) => {
  res.send(req.recordRevision)
}

exports.search = am(async (req, res) => {
  const query = clone(req.query)
  const catalogName = req.service ? req.service.name : undefined

  let result
  if (query.__elastic) {
    result = await elasticSearch(query)
  } else {
    result = await search(query, catalogName)
  }

  res.send(result)
})

exports.consolidate = am(async (req, res) => {
  await ConsolidatedRecord.triggerUpdated(req.record.recordId, 'manual')
  res.send({status: 'ok'})
})

exports.thumbnail = (req, res) => {
  const thumbnail = req.record.metadata.thumbnails.find(th => th.originalUrlHash === req.params.originalUrlHash)

  if (!thumbnail) {
    throw new Http404()
  }

  proxyThumbnail(thumbnail.originalUrl)(req, res)
}
