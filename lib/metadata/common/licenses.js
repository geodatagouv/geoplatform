const {kebabCase} = require('lodash')

exports.getLicenseFromLinks = function (links) {
  let license

  for (const link of links) {
    const lcName = (link.name || '').toLowerCase()

    if (lcName.includes('licence') && lcName.includes('ouverte')) {
      return 'lov2'
    }

    if (lcName.includes('odbl')) {
      license = 'odc-odbl'
    }
  }

  return license
}

const openDataKeywords = [
  'donnee-ouverte',
  'donnees-ouvertes',
  'donnee-ouvertes',
  'donnees-ouverte',
  'opendata',
  'open-data'
]

exports.getLicenseFromKeywords = function (keywords) {
  keywords = keywords.map(kebabCase)
  let openness = false

  // Detect PRODIGE usual keywords
  openness = openness || (keywords.includes('grand-public') &&
        (keywords.includes('non-restreint') || keywords.includes('ouvert')))

  // Detect official keyword and variations (CNIG)
  openness = openness || keywords.find(k => openDataKeywords.includes(k))

  return openness ? 'lov2' : null
}

const catalogsKnownAsOpen = [
  '54f5a39a62781800bf6db9e6',
  '53a01c3c23a9836106440e0f'
]

exports.getLicenseFromCatalogs = function (catalogs) {
  const isOpen = catalogs.some(catalog => catalogsKnownAsOpen.includes(catalog.toString()))
  return isOpen ? 'lov2' : null
}
