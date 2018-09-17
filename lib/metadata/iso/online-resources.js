const _ = require('lodash')

const {getFileNameFromHref} = require('../common/util')

function getAllOnLineResources(metadata) {
  const transferOptions = _.get(metadata, 'distributionInfo.transferOptions', [])

  return _(transferOptions)
    .map(to => to.onLine || [])
    .flatten()
    .map(resource => ({
      href: resource.linkage,
      protocol: resource.protocol,
      name: resource.name || getFileNameFromHref(resource.linkage),
      description: resource.description
    }))
    .value()
}

module.exports = {getAllOnLineResources}
