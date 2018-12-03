const mongoose = require('mongoose')
const _ = require('lodash')

const {normalizeTypeName} = require('../../utils/feature-types')

const ConsolidatedRecord = mongoose.model('ConsolidatedRecord')
const Service = mongoose.model('Service')
const FeatureType = mongoose.model('FeatureType')

async function getFeatureType(featureType) {
  const typeName = normalizeTypeName(featureType.typeName)
  const featureTypes = await FeatureType.findByService(featureType.serviceId)
  const matchingFeatureType = featureTypes.find(ft => {
    return normalizeTypeName(ft.name) === typeName
  })

  return matchingFeatureType
}

async function getRelatedFeatureTypes(recordId) {
  const related = await ConsolidatedRecord.collection.find({
    'metadata.type': 'service',
    'metadata.serviceType': 'download',
    'metadata.serviceProtocol': 'wfs',
    'metadata.featureTypes.relatedTo': recordId
  }, {
    projection: {
      'metadata.featureTypes': 1
    }
  }).toArray()

  return _(related)
    .map(record => record.metadata.featureTypes)
    .flatten()
    .filter(ft => ft.relatedTo === recordId)
    .value()
}

async function resolveFeatureTypes(recordId, featureTypes = []) {
  featureTypes = _.uniqBy([
    ...await getRelatedFeatureTypes(recordId),
    ...featureTypes
  ], featureType => {
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

module.exports = {
  resolveFeatureTypes,
  normalizeTypeName,
  retrieveResourcesFromFeatureTypes
}
