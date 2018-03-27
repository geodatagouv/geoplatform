'use strict'

const {cleanURL, isPublicURL} = require('../../util/url')
const URI = require('urijs')
const {forEach} = require('lodash')
const {getNormalizedWfsServiceLocation} = require('./services')

class OnlineResource {
  constructor({name, href, protocol, description}) {
    if (!href) {
      throw new Error('location must be defined')
    }
    this.name = name
    this.sourceLocation = cleanURL(href)
    this.sourceProtocol = protocol
    this.description = description

    if (!isPublicURL(this.sourceLocation)) {
      throw new Error('Given location must be publicly available')
    }

    this.location = new URI(this.sourceLocation)
    this.query = this.parseAndNormalizeQuery()
  }

  parseAndNormalizeQuery() {
    const query = {}

    // Ensure query string param names are lower-cased
    forEach(this.location.search(true), (val, key) => {
      query[key.toLowerCase()] = val
    })

    return query
  }

  isWfsFeatureType() {
    const sourceProtocolContainsWfs = (this.sourceProtocol || '').toLowerCase().indexOf('wfs') >= 0
    const sourceLocationIsWfsQuery = (this.query.service || '').toLowerCase() === 'wfs'
    const sourceLocationContainsWfs = (this.sourceLocation || '').toLowerCase().includes('wfs')

    const detectWfsProtocol = sourceProtocolContainsWfs || sourceLocationIsWfsQuery || sourceLocationContainsWfs

    // Ensure we drop well-formed query of other OGC protocols (e.g. WMS)
    if (('service' in this.query) && this.query.service.toLowerCase() !== 'wfs') {
      return false
    }

    if (!detectWfsProtocol) {
      return false
    }

    const typeNameInQuery = this.query.typename || this.query.typenames || this.query.layers
    const typeNameFromName = (sourceProtocolContainsWfs || sourceLocationIsWfsQuery) && this.name

    this.typeNameFound = typeNameInQuery || typeNameFromName

    return Boolean(this.typeNameFound)
  }

  getFeatureTypeName() {
    return this.typeNameFound
  }

  getNormalizedWfsServiceLocation() {
    return getNormalizedWfsServiceLocation(this.sourceLocation)
  }

  isWmsLayer() {
    const sourceProtocolContainsWms = (this.sourceProtocol || '').toLowerCase().indexOf('wms') >= 0
    const sourceLocationIsWmsQuery = (this.query.service || '').toLowerCase() === 'wms'

    const detectWmsProtocol = sourceProtocolContainsWms || sourceLocationIsWmsQuery

    return detectWmsProtocol
  }
}

function castLink({name, href, protocol, description}) {
  try {
    const resource = new OnlineResource({name, href, protocol, description})
    if (resource.isWfsFeatureType()) {
      return {
        serviceURL: resource.getNormalizedWfsServiceLocation(),
        typeName: resource.getFeatureTypeName()
      }
    }
    if (resource.isWmsLayer()) {
      throw new Error('WMS layers are not supported yet')
    }
    return {name, href, description}
  } catch (err) {
    return {
      valid: false,
      reason: err.message
    }
  }
}

module.exports = {castLink}
