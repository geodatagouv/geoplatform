'use strict'

/* eslint no-multi-spaces: 0, key-spacing: 0 */
const mongoose = require('mongoose')
const {Schema} = require('mongoose')
const {enqueue} = require('bull-manager')

const {Mixed} = Schema.Types

const collectionName = 'record_revisions'

const schema = new Schema({

  /* Identification */
  recordId: {
    type: String,
    required: true
  },
  recordHash: {
    type: String,
    required: true
  },

  /* Attributes */
  revisionDate: {
    type: Date
  },

  /* Featuring */
  featured: {
    type: Boolean
  },

  /* Content */
  recordType: {
    type: String,
    enum: ['MD_Metadata', 'Record', 'FC_FeatureCatalog']
  },
  content: {
    type: Mixed,
    required: true
  },

  /* Dates */
  createdAt: {
    type: Date
  },
  touchedAt: {
    type: Date
  }
})

/*
** Indexes
*/

schema.index({recordId: 1, recordHash: 1}, {unique: true})

// Ensure each recordId is featured once
schema.index({
  recordId: 1
}, {
  unique: true,
  partialFilterExpression: {featured: true}
})

/*
** Statics
*/
schema.statics = {
  async upsert({recordId, recordHash, recordType, content, revisionDate}) {
    const now = new Date()

    const updateResponse = await this.updateOne({
      recordId,
      recordHash
    }, {
      $setOnInsert: {
        content,
        recordType,
        revisionDate,
        createdAt: now
      },
      $set: {
        touchedAt: now
      }
    }, {
      upsert: true
    }).exec()

    await enqueue('elect-record', recordId, {
      recordId
    })

    return updateResponse.upserted ? 'created' : 'touched'
  }

}

const model = mongoose.model('RecordRevision', schema, collectionName)

module.exports = {model, collectionName, schema}
