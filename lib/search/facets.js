'use strict'

const {get, uniq, chain} = require('lodash')

const types = {
  dataset: 'dataset',
  map: 'map',
  nonGeographicDataset: 'nonGeographicDataset',
  series: 'dataset',
  service: 'service'
}

const representationTypes = {
  grid: 'grid',
  vector: 'vector',
  raster: 'grid'
}

function getDistributionFormats(resources) {
  const formats = new Set()

  for (const resource of resources) {
    switch (resource.type) {
      case 'download':
        if (resource.downloads.some(d => d.resourceType !== 'other')) {
          formats.add('file')
        }
        break

      case 'service':
        if (resource.serviceType === 'wfs' && resource.features.some(f => f.available)) {
          formats.add('wfs')
        }
        break

      default:
        break
    }
  }

  return formats
}

function computeFacets(record, {catalogs, publications}) {
  const facets = []

  function mapToFacet(name, mapping, recordAttribute) {
    const value = get(record, recordAttribute)
    const facet = {name}

    if (!value) {
      facet.value = 'none'
    } else if (value in mapping) {
      facet.value = mapping[value]
    } else {
      facet.value = 'other'
    }

    facets.push(facet)
  }

  mapToFacet('type', types, 'metadata.type')
  mapToFacet('representationType', representationTypes, 'metadata.spatialRepresentationType')

  function addToFacet(name, recordAttribute) {
    const values = get(record, recordAttribute)

    if (!values || values.length === 0) {
      facets.push({name, value: 'none'})
      return
    }

    uniq(values).forEach(value => {
      facets.push({name, value})
    })
  }

  addToFacet('organization', 'organizations')
  addToFacet('keyword', 'metadata.keywords')

  facets.push({name: 'metadataType', value: record.metadata.metadataType})

  /* Catalog names */
  chain(catalogs || [])
    .compact()
    .map(c => c.name)
    .uniq()
    .value()
    .forEach(catalogName => facets.push({name: 'catalog', value: catalogName}))

    /* Dataset marked as open */
  const openDataLicense = record.metadata.license === 'fr-lo' || record.metadata.license === 'odc-odbl'
  facets.push({name: 'opendata', value: openDataLicense ? 'yes' : 'not-determined'})

  const distributionFormats = getDistributionFormats(record.resources)

  // Distribution formats
  for (const format of distributionFormats) {
    facets.push({
      name: 'distributionFormat',
      value: format
    })
  }

  // Availability
  facets.push({
    name: 'availability',
    value: distributionFormats.size > 0 ? 'yes' : 'no'
  })

  // Publications
  facets.push({
    name: 'dgvPublication',
    value: publications.some(p => p.target === 'dgv') ? 'yes' : 'no'
  })

  return facets
}

module.exports = {computeFacets}
