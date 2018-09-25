'use strict'

const {Router, json} = require('express')
const cors = require('cors')

const registerCatalogsRoutes = require('./routes/catalogs')
const registerMaintenanceRoutes = require('./routes/maintenance')
const registerPublicationsRoutes = require('./routes/publications')
const registerRecordsRoutes = require('./routes/records')
const registerServicesRoutes = require('./routes/services')

const router = new Router()

router.use(cors({origin: true}))
router.use(json())

registerCatalogsRoutes(router)
registerMaintenanceRoutes(router)
registerPublicationsRoutes(router)
registerRecordsRoutes(router)
registerServicesRoutes(router)

router.use('/links', require('./routes/links'))

router.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  const {statusCode = 500} = error

  if (typeof error.toJSON === 'function') {
    return res.status(statusCode).send(error.toJSON())
  }

  console.error(error)
  res.status(statusCode).send({
    code: statusCode,
    error: 'An unexpected error happened'
  })
})

module.exports = router
