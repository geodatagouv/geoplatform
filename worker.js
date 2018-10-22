require('dotenv').config()

const {configureQueues, createJobQueue, disconnectQueues} = require('bull-manager')
const ms = require('ms')

const sentry = require('./lib/utils/sentry')
const mongoose = require('./lib/utils/mongoose')
const createRedis = require('./lib/utils/redis')

async function main() {
  await mongoose.connect()

  const consolidateRecord = require('./lib/jobs/consolidate-record')
  const electRecord = require('./lib/jobs/elect-record')
  const incomingWebhookLinkProxy = require('./lib/jobs/incoming-webhook-link-proxy')
  const harvestCsw = require('./lib/jobs/harvest-csw')
  const lookupWfs = require('./lib/jobs/lookup-wfs')
  const computeCatalogMetrics = require('./lib/jobs/compute-catalog-metrics')

  configureQueues({
    isSubscriber: true,
    createRedis: createRedis({
      onError: shutdown
    }),
    prefix: 'geoplatform',
    onError: (job, err) => sentry.captureException(err, {
      extra: {
        queue: job.queue.name,
        ...job.data
      }
    })
  })

  await createJobQueue('consolidate-record', consolidateRecord.handler, {
    concurrency: 5
  }, {
    jobIdKey: 'recordId',
    timeout: ms('30s'),
    attempts: 2,
    backoff: {
      delay: ms('10s'),
      type: 'fixed'
    }
  })

  await createJobQueue('elect-record', electRecord.handler, {
    concurrency: 50
  }, {
    jobIdKey: 'recordId',
    timeout: ms('5s'),
    attempts: 5,
    backoff: {
      delay: ms('10s'),
      type: 'fixed'
    }
  })

  await createJobQueue('incoming-webhook-link-proxy', incomingWebhookLinkProxy.handler, {
    concurrency: 10
  }, {
    jobIdKey: 'linkId'
  })

  await createJobQueue('harvest-csw', harvestCsw.handler, {
    concurrency: 2
  }, {
    jobIdKey: 'serviceId'
  })

  await createJobQueue('lookup-wfs', lookupWfs.handler, {
    concurrency: 5
  }, {
    jobIdKey: 'serviceId'
  })

  await createJobQueue('compute-catalog-metrics', computeCatalogMetrics.handler, {
    concurrency: 5
  }, {
    jobIdKey: 'catalogId'
  })

  mongoose.connection.on('disconnected', () => {
    shutdown(new Error('Mongo connection was closed'))
  })
}

async function shutdown(error) {
  sentry.captureException(error)

  try {
    await Promise.all([
      disconnectQueues(),
      mongoose.disconnect()
    ])
  } catch (error) {}

  process.exit(1)
}

main().catch(shutdown)
