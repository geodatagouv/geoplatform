const {SENTRY_DSN} = process.env

if (SENTRY_DSN) {
  const Sentry = require('@sentry/node')
  const pkg = require('../../package.json')

  Sentry.init({
    dsn: SENTRY_DSN,
    release: `${pkg.name}@${pkg.version}`
  })

  module.exports = Sentry
} else {
  module.exports = {
    captureException(error) {
      console.error(error)
    },

    Handlers: {
      requestHandler() {
        return (req, res, next) => {
          next()
        }
      },

      errorHandler() {
        return (error, req, res, next) => {
          console.error(error)
          next(error)
        }
      }
    }
  }
}
