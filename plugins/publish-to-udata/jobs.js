const {createJobQueue} = require('bull-manager')

require('./models') // eslint-disable-line import/no-unassigned-import

const jobs = require('./jobs/definition')

async function registerJobs() {
  await Promise.all(
    jobs.map(job => {
      const {handler, onError} = require(`./jobs/${job.name}`)

      return createJobQueue(job.name, handler, {
        concurrency: job.concurrency,
        onError
      }, job.options)
    })
  )
}

module.exports = {registerJobs}
