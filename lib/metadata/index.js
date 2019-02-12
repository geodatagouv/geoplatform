const {convert: convertFromDublinCore} = require('./dc')
const {convert: convertFromIso} = require('./iso')

module.exports = {
  convertFromIso,
  convertFromDublinCore
}
