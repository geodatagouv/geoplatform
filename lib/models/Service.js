const mongoose = require('mongoose')
const {Schema} = require('mongoose')
const {keyBy} = require('lodash')
const {enqueue} = require('bull-manager')

const supportedProtocols = keyBy([
  {name: 'csw', syncTask: 'harvest-csw'},
  {name: 'wfs', syncTask: 'lookup-wfs'}
], 'name')

const SYNC_STATUSES = ['new', 'successful', 'failed']

const schema = new Schema({

  location: {type: String, required: true},
  protocol: {type: String, enum: Object.keys(supportedProtocols), required: true},

  /* Context */
  name: {type: String, trim: true},
  abstract: {type: String},
  keywords: {type: [String]},

  /* Synchronization */
  sync: {
    status: {type: String, enum: SYNC_STATUSES, index: true, required: true},
    pending: {type: Boolean},
    processing: {type: Boolean},
    itemsFound: {type: Number},
    finishedAt: {type: Date, index: true}
  }
})

/*
** Statics
*/
schema.statics = {
  async setAsPending(uniqueQuery) {
    const {nModified} = await this.update({
      'sync.pending': false,
      'sync.processing': false,
      ...uniqueQuery
    }, {
      $set: {
        'sync.pending': true
      }
    }).exec()

    return nModified === 1
  },

  async triggerSync(uniqueQuery, freshness = 0) {
    const service = await this.findOne(uniqueQuery).exec()

    if (!service) {
      throw new Error('service not found for query: ' + JSON.stringify(uniqueQuery))
    }

    const {syncTask} = supportedProtocols[service.protocol]
    const minFinishedAtAcceptable = new Date(Date.now() - freshness)

    let status
    if (service.sync && service.sync.finishedAt && service.sync.finishedAt > minFinishedAtAcceptable) {
      status = 'ignored' // Fresh
    } else {
      status = await this.setAsPending(uniqueQuery) ? 'ready' : 'ignored'
    }

    if (status === 'ready') {
      await mongoose.model('ServiceSync').create({
        service: service._id,
        status: 'queued'
      })

      await enqueue(syncTask, service.location, {
        serviceId: service._id,
        freshness
      })

      return 'queued'
    }

    return status
  },

  async upsert({location, protocol}) {
    if (!protocol) {
      throw new Error('protocol is not defined')
    }
    if (!location) {
      throw new Error('location is not defined')
    }

    const query = {location, protocol}

    const changes = {
      $setOnInsert: {
        sync: {
          status: 'new',
          processing: false,
          pending: false,
          finishedAt: new Date(1970)
        }
      }
    }

    const updateResult = await this
      .update(query, changes, {upsert: true})
      .exec()

    if (!updateResult.upserted) {
      this.triggerSync(query, 2 * 60 * 60 * 1000).catch(console.error) // 2 hours
      const service = await this.findOne(query).exec()
      return service._id
    }
    this.triggerSync(query).catch(console.error)
    return updateResult.upserted[0]._id
  }
}

/*
** Methods
*/
schema.methods.doSync = function (freshness) {
  return mongoose.model('Service').triggerSync({_id: this._id}, freshness)
}

schema.methods.toggleSyncStatus = function (status, itemsFound = 0) {
  return this
    .set('sync.status', status)
    .set('sync.pending', false)
    .set('sync.processing', false)
    .set('sync.finishedAt', new Date())
    .set('sync.itemsFound', itemsFound || 0)
    .save()
}

const collectionName = 'services'

const model = mongoose.model('Service', schema, collectionName)

module.exports = {model, collectionName, schema}
