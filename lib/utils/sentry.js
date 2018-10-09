const raven = require('raven')

const {SENTRY_DSN} = process.env

if (SENTRY_DSN) {
  raven.config(SENTRY_DSN).install()
  module.exports = raven
} else {
  module.exports = {
    captureException(error) {
      console.error(error)
    }
  }
}
