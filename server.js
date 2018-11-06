require('dotenv').config()

const {configureQueues, joinJobQueue, disconnectQueues} = require('bull-manager')

const sentry = require('./lib/utils/sentry')
const mongoose = require('./lib/utils/mongoose')
const createRedis = require('./lib/utils/redis')

const jobs = require('./lib/jobs/definition')

async function main() {
  const port = process.env.PORT || 5000

  await mongoose.connect()

  configureQueues({
    createRedis: createRedis({
      onError: shutdown
    }),
    prefix: 'geoplatform'
  })

  await Promise.all(
    jobs.map(job => {
      return joinJobQueue(job.name, job.options)
    })
  )

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
  } catch (error2) {}

  process.exit(1)
}

main().catch(shutdown)
