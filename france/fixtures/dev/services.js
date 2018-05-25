const {ObjectID} = require('../../../lib/util/mongo')

module.exports = [
  {
    _id: new ObjectID('5387a37d785588482f5acb45'),
    name: 'GéoBretagne',
    location: 'http://geobretagne.fr/geonetwork/srv/fr/csw',
    protocol: 'csw',
    syncEnabled: true,
    sync: {
      status: 'new',
      pending: false,
      processing: false,
      finishedAt: '2018-01-01T00:00:00.000Z'
    },
    processing: false
  }
]
