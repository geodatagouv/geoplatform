const ms = require('ms')

module.exports = [
  {
    name: 'consolidate-record',
    concurrency: 5,
    options: {
      jobIdKey: 'recordId',
      timeout: ms('30s'),
      attempts: 2,
      backoff: {
        delay: ms('10s'),
        type: 'fixed'
      }
    }
  },

  {
    name: 'elect-record',
    concurrency: 50,
    options: {
      jobIdKey: 'recordId',
      timeout: ms('5s'),
      attempts: 5,
      backoff: {
        delay: ms('10s'),
        type: 'fixed'
      }
    }
  },

  {
    name: 'incoming-webhook-link-proxy',
    concurrency: 10,
    options: {
      jobIdKey: 'linkId'
    }
  },

  {
    name: 'harvest-csw',
    concurrency: 2,
    options: {
      jobIdKey: 'serviceId',
      timeout: ms('2h'),
      removeOnFail: true
    }
  },

  {
    name: 'lookup-wfs',
    concurrency: 5,
    options: {
      jobIdKey: 'serviceId',
      removeOnFail: true
    }
  },

  {
    name: 'compute-catalog-metrics',
    concurrency: 5,
    options: {
      jobIdKey: 'catalogId'
    }
  }
]
