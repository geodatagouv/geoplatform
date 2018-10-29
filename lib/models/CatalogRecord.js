const mongoose = require('mongoose')
const {pick} = require('lodash')

const {ObjectId} = mongoose.Schema.Types

const collectionName = 'catalog_records'

/* Schema */
const schema = new mongoose.Schema({

  /* Identification */
  catalog: {
    type: ObjectId,
    ref: 'Service',
    required: true
  },
  recordId: {
    type: String,
    required: true
  },

  /* Attributes */
  recordHash: {
    type: String,
    required: true
  },
  revisionDate: {
    type: Date
  },

  /* Dates */
  createdAt: {
    type: Date
  },
  touchedAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  }

})

/* Indexes */
schema.index({catalog: 1, recordId: 1}, {unique: true})

/* Statics */
schema.statics = {

  async touchExisting(catalogRecord) {
    const now = new Date()
    const query = pick(catalogRecord, 'catalog', 'recordId', 'recordHash')

    const response = await this.update(query, {
      $set: {
        touchedAt: now
      }
    })

    return response.nModified === 1
  },

  async doUpsert(catalogRecord) {
    const now = new Date()
    const query = pick(catalogRecord, 'catalog', 'recordId')

    const response = await this.update(query, {
      $setOnInsert: {createdAt: now},
      $set: {
        recordHash: catalogRecord.recordHash,
        revisionDate: catalogRecord.revisionDate,
        updatedAt: now,
        touchedAt: now
      }
    })

    return response.upserted ? 'created' : 'updated'
  },

  async upsert(catalogRecord) {
    const touched = await this.touchExisting(catalogRecord)

    if (touched) {
      return 'touched'
    }

    const status = await this.doUpsert(catalogRecord)

    if (status === 'created') {
      await mongoose.model('ConsolidatedRecord').triggerUpdated(catalogRecord.recordId, 'added to catalog')
    }

    return status
  }

}

/* Declare as model */
const model = mongoose.model('CatalogRecord', schema, collectionName)

module.exports = {model, collectionName, schema}
