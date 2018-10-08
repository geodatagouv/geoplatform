require('dotenv').config()

require('./lib/init') // eslint-disable-line import/no-unassigned-import

require('delayed-jobs').startProcessing()
