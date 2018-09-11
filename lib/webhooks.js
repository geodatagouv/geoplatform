'use strict'

const {Router} = require('express')
const bodyParser = require('body-parser')
const {handleIncomingWebHook} = require('./services/link-proxy')

const app = new Router()

app.use(bodyParser.json())

app.post('/link-proxy', handleIncomingWebHook)

module.exports = app
