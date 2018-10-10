const mongoose = require('mongoose')
const debug = require('debug')('geoplatform:jobs:elect-record')

const CatalogRecord = mongoose.model('CatalogRecord')
const RecordRevision = mongoose.model('RecordRevision')
const Record = mongoose.model('ConsolidatedRecord')

async function electRecord({data: {recordId}}) {
  const catalogRecord = await CatalogRecord.collection.findOne({
    recordId
  }, {
    sort: [
      ['revisionDate', -1],
      ['touchedAt', -1]
    ],
    projection: {
      recordHash: 1
    }
  })

  if (!catalogRecord) {
    // Catalog record doesn’t exist
    return
  }

  const {recordHash} = catalogRecord

  const electedRecord = await RecordRevision.collection.findOne({
    recordId,
    recordHash
  }, {
    projection: {
      featured: 1
    }
  })

  if (!electedRecord || electedRecord.featured) {
    // Record revision doesn’t exist or is already featured
    return
  }

  debug(`Electing new record revision for ${recordId}: ${recordHash}`)

  await Promise.all([
    RecordRevision.collection.updateMany({
      recordId,
      recordHash: {
        $ne: recordHash
      }
    }, {
      $set: {
        featured: false
      }
    }),

    RecordRevision.collection.updateOne({
      recordId,
      recordHash
    }, {
      $set: {
        featured: true
      }
    })
  ])

  await Record.triggerUpdated(recordId, 'new featured revision')
}

exports.handler = electRecord
