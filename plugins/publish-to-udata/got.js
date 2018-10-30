const got = require('got')

module.exports = got.extend({
  headers: {
    'user-agent': 'geoplatform/udata-publisher/v1.0.0 (+https://geo.data.gouv.fr)'
  }
})
