const WfsClient = require('wfs-client')
const debug = require('debug')('geoplatform:jobs:lookup-wfs')
const mongoose = require('mongoose')

const ServiceSyncJob = require('../../sync-job')

const FeatureType = mongoose.model('FeatureType')
const Record = mongoose.model('ConsolidatedRecord')

function filterValidFeatureTypes(featureTypes = []) {
  return featureTypes.filter(ft => ft.name && ft.name.length > 0)
}

class WfsLookupJob extends ServiceSyncJob {
  getCapabilities() {
    const client = new WfsClient(this.service.location, {
      userAgent: 'WFSHarvester',
      timeout: 25
    })
    return client.capabilities()
  }

  async propagateChanges() {
    const records = await Record.distinct('recordId', {
      '_featureTypes.serviceId': this.service._id
    }).exec()

    debug(`Propagating changes to ${records.length} related records`)

    return Promise.all(
      records.map(recordId => {
        return Record.triggerUpdated(recordId, 'feature types updated')
      })
    )
  }

  saveFeatureTypes(featureTypes) {
    return Promise.all(
      featureTypes.map(async ft => {
        await FeatureType.upsert(this.service._id, ft)
        await FeatureType.markAllAsUnavailable(this.service._id, featureTypes)
      })
    )
  }

  updateMetadata(capabilities) {
    if (capabilities.service) {
      const {
        abstract,
        keywords,
        title: name
      } = capabilities.service

      return this.service.set({
        name,
        abstract,
        keywords
      }).save()
    }
  }

  async _sync() {
    const count = await Record.collection.countDocuments({
      '_featureTypes.serviceId': this.service._id
    })

    if (count === 0) {
      debug(`Not analyzing ${this.service.location} as it is not used`)
      return 0
    }

    let featureTypes = []

    debug(`Looking up WFS service ${this.service.location}`)

    try {
      const capabilities = await this.getCapabilities()

      featureTypes = filterValidFeatureTypes(capabilities.featureTypes)
      await this.updateMetadata(capabilities)

      await this.saveFeatureTypes(featureTypes)
      await this.propagateChanges()

      return featureTypes.length
    } catch (error) {
      debug(`Failed looking up WFS service ${this.service.location}`)

      throw error
    }
  }
}

exports.handler = job => {
  return new WfsLookupJob(job, {failsAfter: 60}).exec()
}
