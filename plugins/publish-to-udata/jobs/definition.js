const ms = require('ms')

module.exports = [
  {
    name: 'udata-sync-all',
    concurrency: 1,
    options: {
      jobId: 'unique', // Only one at a time
      timeout: ms('20m')
    }
  },

  {
    name: 'udata-sync-one',
    concurrency: 10,
    options: {
      jobIdKey: 'recordId'
    }
  }
]
