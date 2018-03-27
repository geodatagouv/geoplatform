'use strict'

const Redlock = require('redlock')

const client = require('redis').createClient(
  process.env.REDIS_PORT,
  process.env.REDIS_HOST
)

const redlock = new Redlock(
  [client],
  {
    // The expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01, // Time in ms

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: 3,

    // The time in ms between attempts
    retryDelay: 200 // Time in ms
  }
)

redlock.on('clientError', err => {
  console.error('A redis error has occurred:', err)
})

module.exports = redlock
