'use strict'

const {get, pick, chain} = require('lodash')

const {isPublicURL} = require('../../util/url')
const {getNormalizedWfsServiceLocation} = require('../common/services')

const {getAllKeywords} = require('./keywords')
const {getAllOnLineResources} = require('./online-resources')

function isWFSService(record) {
  const title = get(record, 'identificationInfo.citation.title', '').toLowerCase()
  const keywordsStr = getAllKeywords(record).join('').toLowerCase()
  const serviceType = get(record, 'identificationInfo.serviceType', '').toLowerCase()

  return serviceType === 'download' ||
      serviceType.includes('wfs') ||
      title.includes('wfs') ||
      keywordsStr.includes('wfs') ||
      keywordsStr.includes('infofeatureaccessservice')
}

function getWFSServiceLocation(record) {
  const onlineResources = getAllOnLineResources(record)

  const candidateResources = chain(onlineResources)
    .map(resource => {
      const {linkage, protocol} = resource
      if (!linkage || !isPublicURL(linkage)) {
        return null
      }

      const hasWfsInLocation = linkage && linkage.toLowerCase().includes('wfs')
      const hasWfsInProtocol = protocol && protocol.toLowerCase().includes('wfs')
      if (hasWfsInLocation || hasWfsInProtocol) {
        return resource
      }

      return null
    })
    .compact()
    .value()

  if (candidateResources.length === 1) {
    return getNormalizedWfsServiceLocation(candidateResources[0].linkage)
  }
}

function getCoupledResources(record) {
  return get(record, 'identificationInfo.coupledResource', [])
    .filter(cr => (cr.identifier && cr.scopedName))
    .map(cr => pick(cr, 'identifier', 'scopedName'))
}

module.exports = {
  isWFSService,
  getWFSServiceLocation,
  getCoupledResources
}
