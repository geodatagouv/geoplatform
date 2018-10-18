require('./lib/config/jobs') // eslint-disable-line import/no-unassigned-import

const {getApp} = require('delayed-jobs')

const port = process.env.PORT || 3030
getApp().listen(port)
console.log(`Kue App is listening on port ${port}`)
