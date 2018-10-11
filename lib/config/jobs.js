const {join} = require('path')

const redisConfig = require('./redis')

// Configuration
const jobsPath = join(__dirname, '../jobs')

require('delayed-jobs').configure({
  kuePrefix: process.env.KUE_PREFIX || 'q',
  redisConfig,
  prefix: 'geogw',
  jobsPath,
  definitionsPath: join(jobsPath, 'definitions.yml')
})
