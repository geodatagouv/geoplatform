const {strRight} = require('underscore.string')

function normalizeTypeName(typeName) {
  return strRight(typeName, ':').toLowerCase()
}

module.exports = {
  normalizeTypeName
}
