'use strict'

const {Router} = require('express')
const bodyParser = require('body-parser')
const handleLinkAnalyzerIncomingWebHook = require('./linkAnalyzer').handleIncomingWebHook

const app = new Router()

app.use(bodyParser.json())

app.post('/link-analyzer', handleLinkAnalyzerIncomingWebHook)

module.exports = app
