const mongoose = require('mongoose')
const {addUserToOrganization, removeUserFromOrganization} = require('../udata')

const {Schema} = mongoose
const {ObjectId} = Schema.Types

const {UDATA_PUBLICATION_USER_ID} = process.env

const schema = new Schema({
  /* Dates */
  createdAt: Date,
  updatedAt: Date,

  /* Status */
  enabled: Boolean,

  /* Configuration */
  sourceCatalogs: [ObjectId]
})

schema.method('enable', async function (accessToken) {
  if (this.enabled) {
    return this
  }

  await addUserToOrganization(UDATA_PUBLICATION_USER_ID, this._id, accessToken)
  await this
    .set('enabled', true)
    .save()

  return this
})

schema.method('disable', async function (accessToken) {
  if (!this.enabled) {
    return this
  }

  await removeUserFromOrganization(UDATA_PUBLICATION_USER_ID, this._id, accessToken)
  await this
    .set('enabled', false)
    .save()

  return this
})

schema.pre('save', function (next) {
  if (this.isNew) {
    this.createdAt = new Date()
    this.enabled = false
  }
  this.updatedAt = new Date()
  next()
})

mongoose.model('Organization', schema)
