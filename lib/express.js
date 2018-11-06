'use strict'

const express = require('express')
const morgan = require('morgan')

const {authenticateClient} = require('./api/middlewares/auth')

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true)
  app.use(morgan(':req[x-real-ip] - - [:date] ":method :url HTTP/:http-version" :status - :response-time ms - :res[content-length] ":referrer"'))
} else {
  app.use(morgan('dev'))
}

app.use('/api/geogw', authenticateClient, require('./api'))
app.use('/hooks', require('./webhooks'))

// Mount publish-to-udata plugin
app.use('/dgv', require('../plugins/publish-to-udata/app'))

module.exports = app
