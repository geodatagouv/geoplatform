require('dotenv').config()

require('./lib/init')
require('delayed-jobs').startProcessing()
