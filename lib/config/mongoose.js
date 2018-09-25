'use strict'

const mongoose = require('mongoose')

// Configuration
const config = {
  mongo: {
    url: process.env.MONGODB_URL || 'mongodb://localhost/geogw'
  }
}

// Configure mongoose
mongoose.Promise = require('bluebird')

mongoose.connect(config.mongo.url)

// Load models
/* eslint-disable import/no-unassigned-import */
require('../models/Catalog')
require('../models/CatalogRecord')
require('../models/ConsolidatedRecord')
require('../models/FeatureType')
require('../models/Publication')
require('../models/RecordRevision')
require('../models/Service')
require('../models/ServiceSync')
/* eslint-enable import/no-unassigned-import */
