'use strict'

const express = require('express')
const morgan = require('morgan')

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true)
  app.use(morgan(':req[x-real-ip] - - [:date] ":method :url HTTP/:http-version" :status - :response-time ms - :res[content-length] ":referrer"'))
} else {
  app.use(morgan('dev'))
}

app.use(require('./app'))

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log('Now listening on port %d', port)
})
