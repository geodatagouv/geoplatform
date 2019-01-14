const mongoose = require('mongoose')

const {Schema} = mongoose

const schema = new Schema({
  recordId: {type: String, required: true},

  target: {type: String, required: true, index: true},
  remoteId: {type: String, required: true, index: true},
  remoteUrl: {type: String},

  createdAt: {type: Date},
  updatedAt: {type: Date}
})

schema.pre('save', function (next) {
  if (!this.createdAt) {
    this.createdAt = new Date()
  }

  this.updatedAt = new Date()
  next()
})

function reindexRecord(recordId) {
  return mongoose.model('ConsolidatedRecord').triggerUpdated(recordId, 'reindex')
}

schema.post('save', async (publication, next) => {
  await reindexRecord(publication.recordId)

  next()
})

schema.post('remove', async (publication, next) => {
  await reindexRecord(publication.recordId)

  next()
})

mongoose.model('Publication', schema)
