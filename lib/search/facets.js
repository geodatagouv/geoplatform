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

function computeFacets(record) {
  const facets = []

  /* Dataset marked as open */
  const openDataLicense = record.metadata.license === 'lov2' || record.metadata.license === 'odc-odbl'
  facets.push({
    name: 'opendata',
    value: openDataLicense ? 'yes' : 'no'
  })

  // Availability
  const distributionFormats = getDistributionFormats(record.resources)
  facets.push({
    name: 'availability',
    value: distributionFormats.size > 0 ? 'yes' : 'no'
  })

  return facets
}

module.exports = {computeFacets}
