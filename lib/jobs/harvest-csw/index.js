const {inspect} = require('util')
const each = require('stream-each')
const mongoose = require('mongoose')
const moment = require('moment')
const {omit} = require('lodash')
const csw = require('csw-client')
const stringify = require('json-stable-stringify')
const hasha = require('hasha')
const debug = require('debug')('geoplatform:jobs:harvest-csw')
const {enqueue} = require('bull-manager')

const ServiceSyncJob = require('../../sync-job')

const RecordRevision = mongoose.model('RecordRevision')
const CatalogRecord = mongoose.model('CatalogRecord')

function getValidModifiedDate(date) {
  if (!date) {
    return
  }
  const parsedValue = moment(date, moment.ISO_8601)
  if (!parsedValue.isValid()) {
    return
  }
  if (!moment().isAfter(parsedValue)) {
    return
  }
  return parsedValue.toDate()
}

class CswHarvestJob extends ServiceSyncJob {
  async processRecord(record) {
    const ignore = reason => {
      this.ignored++

      if (reason in this.ignoreStats) {
        this.ignoreStats[reason]++
      } else {
        this.ignoreStats[reason] = 1
      }

      if (reason === 'Identifier too short') {
        this.log('Record identifier too short: %s', record.originalId)
      } else if (reason === 'Identifier too long') {
        this.log('Record identifier too long: %s', record.originalId)
      } else if (reason === 'Not supported type') {
        this.log('Not supported record type: %s', record.type)
      }
    }

    const supportedTypes = [
      'MD_Metadata',
      'Record'
    ]

    if (!supportedTypes.includes(record.type)) {
      return ignore('Not supported type')
    }

    // Technical checks
    if (!record.originalId) {
      return ignore('No identifier')
    }
    if (record.originalId.length < 10) {
      return ignore('Identifier too short')
    }
    if (record.originalId.length > 255) {
      return ignore('Identifier too long')
    }

    if (this.harvester.allStarted) {
      this.progress(this.returned, this.harvester.matched)
    }

    const catalogRecordRevision = {
      catalog: this.service,
      recordId: record.id,
      recordHash: record.hash,
      recordType: record.type,
      revisionDate: getValidModifiedDate(record.modified),
      content: record.body
    }

    try {
      await RecordRevision.upsert(catalogRecordRevision)
      await CatalogRecord.upsert(catalogRecordRevision)
      this.returned++
    } catch (error) {
      this.errored++
      this.log(inspect(error))
    }
  }

  _sync() {
    this.returned = 0
    this.ignored = 0
    this.errored = 0

    this.ignoreStats = {}

    const {location} = this.service

    debug(`Harvesting CSW service ${location}`)

    const client = csw(location)
    const schema = location.includes('grandlyon') || location.includes('adour-garonne') ? 'both' : 'iso'
    this.harvester = client.harvest({schema})

    this.harvester.once('started', () => {
      this.log('Records matched: %d', this.harvester.matched)
    })

    return new Promise((resolve, reject) => {
      each(this.harvester, (record, next) => {
        this.processRecord(record)
        this.progress(this.harvester.progression / this.harvester.total)
        next()
      }, error => {
        this.log('Harvester report:')
        this.log(JSON.stringify(this.harvester, true, 2))

        if (error) {
          debug(`Failed harvesting CSW service ${location}`)
          return reject(error)
        }

        this.log('Unique records returned: %d', this.returned)
        this.log('Ignore statistics:')

        Object.keys(this.ignoreStats).forEach(ignoreReason => {
          this.log(`  * ${ignoreReason}: ${this.ignoreStats[ignoreReason]}`)
        })

        // Compute catalog statistics
        // Catalogs and services share the same _id, so we’re passing service._id here.
        enqueue('compute-catalog-metrics', this.service.name, {
          catalogId: this.service._id
        })

        resolve(this.returned)
      })
    })
  }
}

exports.handler = job => {
  return new CswHarvestJob(job, {failsAfter: 600}).exec()
}
