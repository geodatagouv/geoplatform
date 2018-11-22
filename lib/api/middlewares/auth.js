const {Http401} = require('../errors')

const {MAINTENANCE_TOKEN} = process.env

const isMaintenance = (req, res, next) => {
  if (req.query.mtoken && MAINTENANCE_TOKEN && req.query.mtoken === MAINTENANCE_TOKEN) {
    return next()
  }

  return next(new Http401())
}

module.exports = {
  isMaintenance
}
