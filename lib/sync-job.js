const {format} = require('util')
const mongoose = require('mongoose')

const ServiceSync = mongoose.model('ServiceSync')

class ServiceSyncJob {
  constructor(job, options = {}) {
    this.job = job
    this.options = options
  }

  _fail(err) {
    this.clearTimeout()

    if (this.serviceSync) {
      this.serviceSync.toggleError(persistError => {
        if (persistError) {
          console.error('Critical error: unable to persist error status on a serviceSync')
          console.error(persistError)
        }
      })
    }
    this._reject(err)
  }

  _success(count) {
    this.clearTimeout()

    this.serviceSync.toggleSuccessful(count, err => {
      if (err) {
        console.error('Critical error: unable to persist success status on a serviceSync')
        console.error(err)
      }
      this._resolve()
    })
  }

  exec() {
    return new Promise(async (resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
      this.touchTimeout()

      try {
        const serviceSync = await ServiceSync
          .findOne({
            service: this.job.data.serviceId,
            status: 'queued'
          })
          .populate('service')
          .exec()

        if (!serviceSync) {
          return this._fail(new Error('No related ServiceSync found!'))
        }

        this.serviceSync = serviceSync
        this.id = serviceSync._id
        this.service = serviceSync.service

        const result = await this._sync()

        this._success(result)
      } catch (error) {
        this._fail(error)
      }
    })
  }

  log(...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }

    this.serviceSync.log.push(format(...args))
  }

  progress(progression) {
    this.touchTimeout()
    this.job.progress(progression * 100)
  }

  touchTimeout() {
    this.clearTimeout()

    if (this.options.failsAfter) {
      this.failsAfterTimeout = setTimeout(() => {
        this._fail(new Error('Synchronization timeout'))
      }, this.options.failsAfter * 1000)
    }
  }

  clearTimeout() {
    if (this.failsAfterTimeout) {
      clearTimeout(this.failsAfterTimeout)
    }
  }
}

module.exports = ServiceSyncJob
