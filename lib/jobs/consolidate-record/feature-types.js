'use strict'

const mongoose = require('mongoose')
const {strRight} = require('underscore.string')
const _ = require('lodash')

const Service = mongoose.model('Service')

function normalizeTypeName(typeName) {
  return strRight(typeName, ':').toLowerCase()
}

async function isFeatureTypeAvailable(featureType) {
  const FeatureType = mongoose.model('FeatureType')

  const typeName = normalizeTypeName(featureType.typeName)
  const featureTypes = await FeatureType.findByService(featureType.serviceId)
  const matchingFeatureType = featureTypes.find(ft => {
    return normalizeTypeName(ft.name) === typeName
  })

  return Boolean(matchingFeatureType)
}

function resolveFeatureTypes(featureTypes = []) {
  featureTypes = _.uniqBy(featureTypes, featureType => {
    return `${featureType.serviceURL}@${featureType.typeName}`.toLowerCase()
  })

  return Promise.all(
    featureTypes.map(async featureType => {
      // We should probably not upsert them every time as it triggers a `lookup-wfs` job.
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
      const available = await isFeatureTypeAvailable(ft)

      return {
        ...ft,
        available
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

        features: entries.map(({typeName, description, available}) => ({
          name: typeName,
          description,
          available
        }))
      }
    })
    .value()
}

module.exports = {resolveFeatureTypes, normalizeTypeName, retrieveResourcesFromFeatureTypes}
