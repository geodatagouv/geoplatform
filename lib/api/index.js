'use strict'

const {Router} = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const registerCatalogsRoutes = require('./routes/catalogs')
const registerMaintenanceRoutes = require('./routes/maintenance')
const registerPublicationsRoutes = require('./routes/publications')
const registerRecordsRoutes = require('./routes/records')
const registerServicesRoutes = require('./routes/services')

const app = new Router()

app.use(cors({origin: true}))
app.use(bodyParser.json())

registerCatalogsRoutes(app)
registerMaintenanceRoutes(app)
registerPublicationsRoutes(app)
registerRecordsRoutes(app)
registerServicesRoutes(app)

app.use('/links', require('./routes/links'))

module.exports = app
