'use strict'

function getLicenseFromConstraints(constraints) {
  const candidateLicenses = constraints
    .map(constraintsPart => {
      const {useConstraints, useLimitation} = constraintsPart
      if (!useConstraints || !useLimitation) {
        return
      }
      if (useConstraints.includes('license') && useLimitation.join(' ').toLowerCase().includes('odbl')) {
        return 'odc-odbl'
      }
    })
    .filter(license => Boolean(license))

  if (candidateLicenses.length > 0) {
    return candidateLicenses[0]
  }
}

module.exports = {
  getLicenseFromConstraints
}
