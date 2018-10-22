const mongoose = require('mongoose')

class Mongoose {
  async connect() {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/geogw', {
      autoIndex: true,
      reconnectTries: 1
    })

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

    this.connection = mongoose.connection
  }

  disconnect() {
    return mongoose.disconnect()
  }
}

module.exports = new Mongoose()
