const mongoose = require('mongoose')
const hasha = require('hasha')
const stringify = require('json-stable-stringify')
const {enqueue} = require('bull-manager')
const dgv = require('../udata')
const mapping = require('../mapping')
const {getRecord, setRecordPublication, unsetRecordPublication} = require('../geogw')

const {Schema} = mongoose
const {ObjectId} = Schema.Types

const {DATAGOUV_URL} = process.env

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

schema.method('getRecord', async function () {
  const record = await getRecord(this._id)

  if (!record.metadata) {
    throw new Error('Record found but empty metadata: ' + this._id)
  }

  return record
})

schema.method('computeDataset', async function () {
  const record = await this.getRecord()
  return mapping.map(record)
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

schema.method('selectTargetOrganization', async function () {
  const currentOrganization = this.publication.organization
  const eligibleOrganizations = await this.getEligibleOrganizations()

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
})

schema.method('update', async function (options = {}) {
  if (!this.isPublished()) {
    throw new Error('Dataset not published')
  }

  const datasetId = this.publication._id

  const [dataset, targetOrganization] = await Promise.all([
    this.computeDataset(),
    this.selectTargetOrganization(this.publication.organization)
  ])

  if (targetOrganization !== this.publication.organization) {
    try {
      await this.transferTo(targetOrganization)
    } catch (error) {
      if (error.message === 'Dataset doesn’t exist') {
        throw new Error('Target dataset doesn’t exist anymore')
      }

      throw error
    }
  }

  const hash = getHash(dataset)
  if (!options.force && this.hash && this.hash === hash) {
    throw new Error('Unchanged dataset')
  }

  this.set('hash', hash)

  let publishedDataset
  try {
    publishedDataset = await dgv.updateDataset(datasetId, dataset)
  } catch (error) {
    if (error.statusCode === 404) {
      throw new Error('Target dataset doesn’t exist anymore')
    }

    throw error
  }

  return this
    .set('title', publishedDataset.title)
    .set('publication.updatedAt', new Date())
    .set('publication.organization', publishedDataset.organization.id)
    .save()
})

schema.method('asyncUpdate', function (data = {}) {
  if (!this.isPublished()) {
    throw new Error('Dataset not published')
  }

  return enqueue('udata-sync-one', `update: ${this._id}`, {
    ...data,
    recordId: this._id,
    action: 'update'
  })
})

schema.method('notifyPublication', function () {
  return setRecordPublication(this._id, {
    remoteId: this.publication._id,
    remoteUrl: `${DATAGOUV_URL}/datasets/${this.publication._id}/`
  })
})

schema.method('publish', async function () {
  if (this.isPublished()) {
    throw new Error('Dataset already published')
  }

  const [dataset, targetOrganization] = await Promise.all([
    this.computeDataset(),
    this.selectTargetOrganization(this.publication.organization)
  ])

  this.set('hash', getHash(dataset))
  dataset.organization = targetOrganization
  const publishedDataset = await dgv.createDataset(dataset)

  const now = new Date()
  await this
    .set('title', publishedDataset.title)
    .set('publication.updatedAt', now)
    .set('publication.createdAt', now)
    .set('publication._id', publishedDataset.id)
    .set('publication.organization', publishedDataset.organization.id)
    .save()

  await this.notifyPublication()

  return this
})

schema.method('asyncPublish', async function ({organizationId}) {
  if (this.isPublished()) {
    throw new Error('Dataset already published')
  }

  await enqueue('udata-sync-one', `publish: ${this._id}`, {
    recordId: this._id,
    action: 'publish',
    organizationId
  })
})

schema.method('removeAndNotify', async function () {
  try {
    await this.delete()

    await unsetRecordPublication(this._id)
  } catch (error) {
    if (error.statusCode === 404) {
      return
    }

    throw error
  }

  return this
})

schema.method('unpublish', async function () {
  if (!this.isPublished()) {
    throw new Error('Dataset not published')
  }

  await dgv.deleteDataset(this.publication._id)

  return this.removeAndNotify()
})

schema.method('asyncUnpublish', function () {
  if (!this.isPublished()) {
    throw new Error('Dataset not published')
  }

  return enqueue('udata-sync-one', `unpublish: ${this._id}`, {
    recordId: this._id,
    action: 'unpublish'
  })
})

schema.method('transferTo', async function (targetOrganization, force = false) {
  if (targetOrganization === this.publication.organization && !force) {
    return this
  }

  await dgv.transferDataset(this.publication._id, targetOrganization)

  return this.set('publication.organization', targetOrganization).save()
})

schema.static('asyncSynchronizeAll', data => {
  return enqueue('udata-sync-all', data)
})

mongoose.model('Dataset', schema)
