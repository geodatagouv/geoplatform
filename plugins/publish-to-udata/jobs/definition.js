const ms = require('ms')

module.exports = [
  {
    name: 'udata-sync-all',
    concurrency: 1,
    options: {
      jobId: 'unique', // Only one at a time
      timeout: ms('1h')
    }
  },

  {
    name: 'udata-sync-one',
    concurrency: 3,
    options: {
      jobIdKey: 'recordId'
    }
  }
]
