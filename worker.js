require('dotenv').config()

const {configureQueues, createJobQueue, disconnectQueues} = require('bull-manager')

const sentry = require('./lib/utils/sentry')
const mongoose = require('./lib/utils/mongoose')
const createRedis = require('./lib/utils/redis')

const jobs = require('./lib/jobs/definition')

const {registerJobs: registerUdataJobs} = require('./plugins/publish-to-udata/jobs')

async function main() {
  await mongoose.connect()

  configureQueues({
    isSubscriber: true,
    createRedis: createRedis({
      onError: shutdown
    }),
    prefix: 'geoplatform',
    onError: (job, err) => {
      sentry.captureException(err, {
        extra: {
          queue: job.queue.name,
          ...job.data
        }
      })
    }
  })

  await Promise.all(
    jobs.map(job => {
      const {handler, onError} = require(`./lib/jobs/${job.name}`)

      return createJobQueue(job.name, handler, {
        concurrency: job.concurrency,
        onError
      }, job.options)
    })
  )

  await registerUdataJobs()

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
  } catch (error2) {}

  process.exit(1)
}

main().catch(shutdown)
