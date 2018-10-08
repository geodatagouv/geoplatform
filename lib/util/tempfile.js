const {mkdtemp} = require('fs')
const {tmpdir} = require('os')
const {join} = require('path')

function createTempDirectory(prefix = 'geoplatform_') {
  return new Promise((resolve, reject) => {
    mkdtemp(join(tmpdir(), prefix), (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

module.exports = {createTempDirectory}
