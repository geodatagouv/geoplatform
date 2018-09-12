'use strict'

const {Router} = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const registerCatalogsRoutes = require('./routes/catalogs')
const registerFilePackagesRoutes = require('./routes/filePackages')
const registerMaintenanceRoutes = require('./routes/maintenance')
const registerPublicationsRoutes = require('./routes/publications')
const registerRecordsRoutes = require('./routes/records')
const registerServicesRoutes = require('./routes/services')

const app = new Router()

app.use(cors({origin: true}))
app.use(bodyParser.json())

registerCatalogsRoutes(app)
registerFilePackagesRoutes(app)
registerMaintenanceRoutes(app)
registerPublicationsRoutes(app)
registerRecordsRoutes(app)
registerServicesRoutes(app)

module.exports = app
