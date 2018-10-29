'use strict'

const {parse} = require('querystring')
const {pick} = require('lodash')
const URI = require('urijs')

function getNormalizedWfsServiceLocation(location) {
  location = new URI(location)
  const query = parse(location.query())
  // Map is used by MapServer
  // port is used by Business Geographic proxy
  location.search(pick(query, 'map', 'port'))
  location.fragment('').normalize()
  return location.valueOf()
}

module.exports = {getNormalizedWfsServiceLocation}
