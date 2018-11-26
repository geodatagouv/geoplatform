const mongoose = require('mongoose')
const {keyBy} = require('lodash')

const am = require('../../../lib/api/middlewares/async')
const {Http404} = require('../../../lib/api/errors')

const {getRecord} = require('../geogw')

const Dataset = mongoose.model('Dataset')
const Record = mongoose.model('ConsolidatedRecord')

const {DATAGOUV_URL} = process.env

/* Helpers */

function getRemoteUrl(remoteId) {
  return `${DATAGOUV_URL}/datasets/${remoteId}/`
}

async function getNotPublishedYetDatasets(organization) {
  const publishedIds = await Dataset.distinct('_id').exec()

  const records = await Record
    .find({
      facets: {$all: [
        {$elemMatch: {name: 'availability', value: 'yes'}},
        {$elemMatch: {name: 'opendata', value: 'yes'}}
      ]},
      catalogs: {$in: organization.sourceCatalogs},
      organizations: {$in: organization.producers}
    })
    .select('recordId metadata.title')
    .lean()
    .exec()

  return records
    .filter(record => !publishedIds.includes(record.recordId))
    .map(record => ({
      _id: record.recordId,
      title: record.metadata.title
    }))
}

async function getPublishedByOthersDatasets(organization) {
  const datasets = await Dataset
    .find({'publication.organization': {$ne: organization._id}})
    .select('title publication._id')
    .lean()
    .exec()

  const indexedDatasets = keyBy(datasets, '_id')

  const records = await Record
    .find({
      recordId: {$in: Object.keys(indexedDatasets)},
      catalogs: {$in: organization.sourceCatalogs},
      organizations: {$in: organization.producers}
    })
    .select('recordId metadata.title')
    .lean()
    .exec()

  return records.map(record => {
    const indexed = indexedDatasets[record.recordId]

    return {
      _id: record.recordId,
      title: indexed.title || record.metadata.title,
      remoteUrl: getRemoteUrl(indexed.publication._id)
    }
  })
}

async function getPublishedDatasets(organization) {
  const datasets = await Dataset
    .find({'publication.organization': organization._id})
    .select('title publication._id')
    .lean()
    .exec()

  return datasets.map(dataset => ({
    ...dataset,
    remoteUrl: getRemoteUrl(dataset.publication._id)
  }))
}

async function getMetrics(organization) {
  const [published, publishedByOthers, notPublishedYet] = await Promise.all([
    getPublishedDatasets(organization),
    getPublishedByOthersDatasets(organization),
    getNotPublishedYetDatasets(organization)
  ])

  return {
    published: published.length,
    publishedByOthers: publishedByOthers.length,
    notPublishedYet: notPublishedYet.length
  }
}

async function getGlobalMetrics() {
  const publishedCount = await Dataset.countDocuments({}).exec()

  return {
    published: publishedCount
  }
}

/* Params */

exports.fetch = async (req, res, next, id) => {
  try {
    const [record, publicationInfo] = await Promise.all([
      getRecord(id),
      Dataset.findById(id).exec()
    ])

    if (!record) {
      throw new Http404()
    }

    req.dataset = record
    if (publicationInfo && publicationInfo.publication && publicationInfo.publication.organization) {
      req.publicationInfo = publicationInfo
    }

    next()
  } catch (error) {
    next(error)
  }
}

/* Actions */

exports.publish = am(async (req, res) => {
  const dataset = new Dataset({
    _id: req.dataset.recordId
  })

  await dataset.asyncPublish({
    organizationId: req.body.organization
  })

  res.status(202).send()
})

exports.unpublish = am(async (req, res) => {
  await req.publicationInfo.asyncUnpublish()
  res.status(202).send()
})

exports.synchronizeAll = am(async (req, res) => {
  await Dataset.asyncSynchronizeAll({
    unpublishIfRecordNotFound: req.query.unpublishIfRecordNotFound === 'yes', // Opt-in
    removeIfTargetDatasetNotFound: req.query.removeIfTargetDatasetNotFound !== 'no' // Opt-out
  })

  res.status(202).send()
})

exports.metrics = am(async (req, res) => {
  const metrics = await getMetrics(req.organization)
  res.send(metrics)
})

exports.globalMetrics = am(async (req, res) => {
  const metrics = await getGlobalMetrics()
  res.send(metrics)
})

exports.notPublishedYet = am(async (req, res) => {
  const datasets = await getNotPublishedYetDatasets(req.organization)
  res.send(datasets)
})

exports.published = am(async (req, res) => {
  const datasets = await getPublishedDatasets(req.organization)
  res.send(datasets)
})

exports.publishedByOthers = am(async (req, res) => {
  const datasets = await getPublishedByOthersDatasets(req.organization)
  res.send(datasets)
})
