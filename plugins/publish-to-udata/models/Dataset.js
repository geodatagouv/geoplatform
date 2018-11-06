'use strict'

const mongoose = require('mongoose')
const Promise = require('bluebird')
const hasha = require('hasha')
const stringify = require('json-stable-stringify')
const {enqueue} = require('bull-manager')
const dgv = require('../udata')
const {map} = require('../mapping')
const {getRecord, setRecordPublication, unsetRecordPublication} = require('../geogw')

const {Schema} = mongoose
const {ObjectId} = Schema.Types

function getHash(dataset) {
  return hasha(stringify(dataset), {algorithm: 'sha1'})
}

const schema = new Schema({
  _id: {type: String},

  title: String,

  hash: String,

  // Attributes related to the publication on the udata platform
  publication: {
    // Unique ID on the udata platform
    _id: {type: String, unique: true, required: true},

    // Organization on the udata platform which hold the dataset
    organization: {type: ObjectId, ref: 'Organization', required: true},

    // Published dataset revision
    revision: {type: Date},

    createdAt: {type: Date},
    updatedAt: {type: Date, index: true, sparse: true}
  }

})

schema.method('isPublished', function () {
  return this.publication && this.publication._id
})

schema.method('getRecord', function () {
  if (!this.getRecordPromise) {
    this.getRecordPromise = getRecord(this._id)
      .then(record => {
        if (!record.metadata) {
          throw new Error('Record found but empty metadata: ' + this._id)
        }
        return record
      })
      .catch(err => {
        if (err.status === 404) {
          throw new Error('Record not found')
        }
        throw err
      })
  }
  return this.getRecordPromise
})

schema.method('computeDataset', async function () {
  const record = await this.getRecord()
  return map(record)
})

schema.method('getEligibleOrganizations', async function () {
  const Producer = mongoose.model('Producer')
  const Organization = mongoose.model('Organization')

  const record = await this.getRecord()
  const organizationIds = await Producer.distinct('associatedTo', {
    _id: {$in: record.organizations}
  }).exec()

  const organizations = await Promise.all(
    organizationIds.map(organizationId => {
      return Organization.findById(organizationId)
    })
  )

  return organizations.filter(organization => record.catalogs.some(c => {
    return organization.sourceCatalogs.some(sourceCatalog => sourceCatalog.equals(c))
  }))
})

schema.method('selectTargetOrganization', function () {
  const currentOrganization = this.publication.organization

  return Promise.join(
    this.getRecord(),
    this.getEligibleOrganizations(),

    (record, eligibleOrganizations) => {
      // Current organization is eligible
      if (currentOrganization && eligibleOrganizations.some(eo => eo._id.equals(currentOrganization))) {
        return currentOrganization
      }

      // We elected an organization
      if (eligibleOrganizations.length > 0) {
        return eligibleOrganizations[0]._id
      }

      // We fall back to current organization
      if (currentOrganization) {
        return currentOrganization
      }

      throw new Error('No eligible organization found!')
    }
  )
})

schema.method('update', function (options = {}) {
  if (!this.isPublished()) {
    return Promise.reject(new Error('Dataset not published'))
  }
  const datasetId = this.publication._id

  return Promise
    .join(
      this.computeDataset(),
      this.selectTargetOrganization(this.publication.organization),

      (dataset, targetOrganization) => {
        if (targetOrganization !== this.publication.organization) {
          return this.transferTo(targetOrganization)
            .catch(err => {
              if (err.message === 'Dataset doesn\'t exist') {
                throw new Error('Target dataset doesn\'t exist anymore')
              }
              throw err
            })
            .thenReturn(dataset)
        }
        return dataset
      }
    )
    .then(dataset => {
      const hash = getHash(dataset)
      if (!options.force && this.hash && this.hash === hash) {
        throw new Error('Unchanged dataset')
      }
      this.set('hash', hash)
      return dataset
    })
    .then(dataset => {
      return dgv.updateDataset(datasetId, dataset)
        .catch(err => {
          if (err.status === 404) {
            throw new Error('Target dataset doesn\'t exist anymore')
          }
          throw err
        })
    })
    .then(publishedDataset => {
      return this
        .set('title', publishedDataset.title)
        .set('publication.updatedAt', new Date())
        .set('publication.organization', publishedDataset.organization.id)
        .save()
    })
})

schema.method('asyncUpdate', function (data = {}) {
  if (!this.isPublished()) {
    return Promise.reject(new Error('Dataset not published'))
  }

  return enqueue('udata-sync-one', {
    ...data,
    recordId: this._id,
    action: 'update'
  })
})

schema.method('notifyPublication', function () {
  const remoteUrl = `${process.env.DATAGOUV_URL}/datasets/${this.publication._id}/`
  return setRecordPublication(this._id, {remoteId: this.publication._id, remoteUrl})
})

schema.method('publish', function () {
  if (this.isPublished()) {
    return Promise.reject(new Error('Dataset already published'))
  }

  return Promise
    .join(
      this.computeDataset(),
      this.selectTargetOrganization(this.publication.organization),

      (dataset, targetOrganization) => {
        this.set('hash', getHash(dataset))
        dataset.organization = targetOrganization
        return dgv.createDataset(dataset)
      }
    )
    .then(publishedDataset => {
      const now = new Date()
      return this
        .set('title', publishedDataset.title)
        .set('publication.updatedAt', now)
        .set('publication.createdAt', now)
        .set('publication._id', publishedDataset.id)
        .set('publication.organization', publishedDataset.organization.id)
        .save()
    })
    .then(() => this.notifyPublication())
    .thenReturn(this)
})

schema.method('asyncPublish', async function ({organizationId}) {
  if (this.isPublished()) {
    throw new Error('Dataset already published')
  }

  console.log('publishing?')

  await enqueue('udata-sync-one', {
    recordId: this._id,
    action: 'publish',
    organizationId
  })
})

schema.method('removeAndNotify', function () {
  return this.remove()
    .then(() => unsetRecordPublication(this._id))
    .catch(err => {
      if (err.status === 404) {
        return
      }
      throw err
    })
    .thenReturn(this)
})

schema.method('unpublish', function () {
  if (!this.isPublished()) {
    return Promise.reject(new Error('Dataset not published'))
  }

  return Promise.resolve(
    dgv.deleteDataset(this.publication._id)
      .then(() => this.removeAndNotify())
  ).thenReturn(this)
})

schema.method('asyncUnpublish', function () {
  if (!this.isPublished()) {
    return Promise.reject(new Error('Dataset not published'))
  }

  return enqueue('udata-sync-one', {
    recordId: this._id,
    action: 'unpublish'
  })
})

schema.method('transferTo', function (targetOrganization, force = false) {
  if (targetOrganization === this.publication.organization && !force) {
    return Promise.resolve(this)
  }

  return dgv.transferDataset(this.publication._id, targetOrganization)
    .then(() => this.set('publication.organization', targetOrganization).save())
})

schema.static('asyncSynchronizeAll', data => {
  return enqueue('udata-sync-all', data)
})

mongoose.model('Dataset', schema)
