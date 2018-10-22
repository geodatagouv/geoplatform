const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/geogw', {
  autoIndex: true
})

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
