const mongoose = require('mongoose')

const {Schema} = mongoose
const {ObjectId, Mixed} = Schema.Types

const schema = new Schema({
  slug: {
    type: String,
    unique: true,
    sparse: true
  },

  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  tags: {
    type: [String],
    index: true
  },

  homepage: {
    type: String
  },

  featured: {
    type: Boolean,
    index: true,
    required: true,
    default: false
  },

  service: {
    type: ObjectId,
    ref: 'Service',
    required: true
  },

  metrics: {
    type: Mixed
  },

  createdAt: Date,
  updatedAt: Date
})

schema.method('markRecordsAsOutdated', function () {
  const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')

  return ConsolidatedRecord.markAsOutdated({catalogs: this._id})
})

schema.method('deleteAndClean', async function () {
  const Service = mongoose.model('Service')
  const CatalogRecord = mongoose.model('CatalogRecord')
  const ServiceSync = mongoose.model('ServiceSync')

  await Promise.all([
    Service.remove({_id: this._id}).exec(),
    ServiceSync.remove({service: this._id}).exec(),
    CatalogRecord.remove({catalog: this._id}).exec()
  ])

  await this.remove()
  await this.markRecordsAsOutdated()

  return this
})

schema.method('rename', async function (name) {
  if (!name) {
    throw new Error('name is required')
  }

  if (name === this.name) {
    return this
  }

  const Service = mongoose.model('Service')

  await Service.updateOne({
    _id: this._id
  }, {
    $set: {name}
  }).exec()

  this.set({name})

  await this.save()
  await this.markRecordsAsOutdated()

  return this
})

schema.pre('save', function (next) {
  const now = new Date()

  if (this.isNew) {
    if (!this.isInit('createdAt')) {
      this.set('createdAt', now)
    }
  }
  if (this.isModified()) {
    this.set('updatedAt', now)
  }
  next()
})

mongoose.model('Catalog', schema)
