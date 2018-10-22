require('dotenv').config()

const {configureQueues, joinJobQueue, disconnectQueues} = require('bull-manager')
const ms = require('ms')

const sentry = require('./lib/utils/sentry')
const mongoose = require('./lib/utils/mongoose')
const createRedis = require('./lib/utils/redis')

async function main() {
  const port = process.env.PORT || 5000

  await mongoose.connect()

  configureQueues({
    createRedis: createRedis({
      onError: shutdown
    }),
    prefix: 'geoplatform'
  })

  await joinJobQueue('consolidate-record', {
    jobIdKey: 'recordId',
    timeout: ms('30s'),
    attempts: 2,
    backoff: {
      delay: ms('10s'),
      type: 'fixed'
    }
  })

  await joinJobQueue('elect-record', {
    jobIdKey: 'recordId',
    timeout: ms('5s'),
    attempts: 5,
    backoff: {
      delay: ms('10s'),
      type: 'fixed'
    }
  })

  await joinJobQueue('incoming-webhook-link-proxy', {
    jobIdKey: 'linkId'
  })

  await joinJobQueue('harvest-csw', {
    jobIdKey: 'serviceId'
  })

  await joinJobQueue('lookup-wfs', {
    jobIdKey: 'serviceId'
  })

  await joinJobQueue('compute-catalog-metrics', {
    jobIdKey: 'catalogId'
  })

  mongoose.connection.on('disconnected', () => {
    shutdown(new Error('Mongo connection was closed'))
  })

  require('./lib/express').listen(port, () => {
    console.log('Now listening on port %d', port)
  })
}

async function shutdown(error) {
  sentry.captureException(error)

  try {
    await Promise.all([
      mongoose.disconnect(),
      disconnectQueues()
    ])
  } catch (error) {}

  process.exit(1)
}

main().catch(shutdown)
