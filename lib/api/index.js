const {Router, json} = require('express')
const cors = require('cors')

const sentry = require('../utils/sentry')

const registerPublicationsRoutes = require('./routes/publications')
const registerRecordsRoutes = require('./routes/records')
const registerServicesRoutes = require('./routes/services')

const router = new Router()

router.use(cors({origin: true}))
router.use(json())

registerPublicationsRoutes(router)
registerRecordsRoutes(router)
registerServicesRoutes(router)

router.use('/maintenance', require('./routes/maintenance'))
router.use('/catalogs', require('./routes/catalogs'))
router.use('/links', require('./routes/links'))

router.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  const {statusCode = 500} = error

  if (typeof error.toJSON === 'function') {
    return res.status(statusCode).send(error.toJSON())
  }

  sentry.captureException(error)
  res.status(statusCode).send({
    code: statusCode,
    error: 'An unexpected error happened'
  })
})

module.exports = router
