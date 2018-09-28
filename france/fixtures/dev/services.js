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
  },
  {
    _id: new ObjectID('57d11af43d068d1c67a240a4'),
    name: 'Orléans AgglO',
    location: 'http://services.api.isogeo.com/ows/s/69352d7fa1474a1b81847282bd3bcd2e/c/40ffceda03034ee9adec9896f00fd758/KVe_Z1w6KoBUM6kc840gbVfzeXjU0',
    protocol: 'csw',
    syncEnabled: true,
    sync: {
      status: 'new',
      pending: false,
      processing: false,
      finishedAt: '2018-01-01T00:00:00.000Z'
    },
    processing: false
  },
  {
    _id: new ObjectID('54c645b2d40960ecfa441f4a'),
    name: 'Catalogue Grand Poitiers',
    location: 'https://infogeo.grandpoitiers.fr/geoportal/csw/discovery',
    protocol: 'csw',
    syncEnabled: true,
    sync: {
      status: 'new',
      pending: false,
      processing: false,
      finishedAt: '2018-01-01T00:00:00.000Z'
    },
    processing: false
  },
  {
    _id: new ObjectID('53a01c3c23a9836106440e0f'),
    name: 'Data Eaufrance',
    location: 'http://www.data.eaufrance.fr/geosource/srv/fre/csw',
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
