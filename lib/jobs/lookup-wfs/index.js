'use strict'

const WfsClient = require('wfs-client')
const debug = require('debug')('geoplatform:jobs:lookup-wfs')
const {uniq, flatten} = require('lodash')
const mongoose = require('mongoose')

const sentry = require('../../../lib/utils/sentry')

const ServiceSyncJob = require('../../syncJob')

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

  async getRelatedRecords() {
    const query = {
      '_featureTypes.service': this.service._id
    }

    return uniq(flatten(await Promise.all([
      Record.distinct('recordId', query).exec(),
      Record.distinct('_featureTypes.relatedTo', query).exec()
    ])))
  }

  async propagateChanges() {
    const records = await this.getRelatedRecords()

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
    const {abstract, keywords} = capabilities.service
    const name = capabilities.service.title

    return this.service
      .set({name, abstract, keywords})
      .save()
  }

  async _sync() {
    try {
      let featureTypes = []

      const capabilities = await this.getCapabilities()

      try {
        featureTypes = filterValidFeatureTypes(capabilities.featureTypes)
        await this.updateMetadata(capabilities)
      } catch (error) {
        debug(`Failed updating metadata for service ${this.service.location}`)
        sentry.captureException(error)
      }

      await this.saveFeatureTypes(featureTypes)
      await this.propagateChanges()
      await this.success(featureTypes.length)
    } catch (error) {
      this.fail(error)
    }
  }
}

/*
** Exports
*/
exports.handler = function ({data, log, progress}) {
  return (new WfsLookupJob({data, log, progress}, {failsAfter: 60})).exec()
}
