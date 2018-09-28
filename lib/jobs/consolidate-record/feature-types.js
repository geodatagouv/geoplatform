'use strict'

const mongoose = require('mongoose')
const {strRight} = require('underscore.string')
const _ = require('lodash')

function normalizeTypeName(typeName) {
  return strRight(typeName, ':').toLowerCase()
}

async function getFeatureType(featureType) {
  const FeatureType = mongoose.model('FeatureType')

  const typeName = normalizeTypeName(featureType.typeName)
  const featureTypes = await FeatureType.findByService(featureType.serviceId)
  const matchingFeatureType = featureTypes.find(ft => {
    return normalizeTypeName(ft.name) === typeName
  })

  return matchingFeatureType
}

function resolveFeatureTypes(featureTypes = []) {
  const Service = mongoose.model('Service')

  featureTypes = _.uniqBy(featureTypes, featureType => {
    return `${featureType.serviceURL}@${featureType.typeName}`.toLowerCase()
  })

  return Promise.all(
    featureTypes.map(async featureType => {
      const serviceId = await Service.upsert({
        location: featureType.serviceURL,
        protocol: 'wfs'
      })

      return {
        ...featureType,
        serviceId
      }
    })
  )
}

async function retrieveResourcesFromFeatureTypes(featureTypes = []) {
  const result = await Promise.all(
    featureTypes.map(async ft => {
      const source = await getFeatureType(ft)

      if (source) {
        return {
          ...ft,
          id: source._id,
          name: source.name,
          available: true
        }
      }

      return {
        ...ft,
        available: false
      }
    })
  )

  return _(result)
    .groupBy('serviceId')
    .map(entries => {
      const [first] = entries

      return {
        type: 'service',
        serviceType: 'wfs',
        serviceId: first.serviceId,
        href: first.serviceURL,

        features: entries.map(({serviceId, serviceURL, ...rest}) => rest)
      }
    })
    .value()
}

module.exports = {resolveFeatureTypes, normalizeTypeName, retrieveResourcesFromFeatureTypes}
