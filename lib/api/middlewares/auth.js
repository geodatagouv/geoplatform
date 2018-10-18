const {Http401, Http403} = require('../errors')

const {MAINTENANCE_TOKEN} = process.env

const isMaintenance = (req, res, next) => {
  if (req.query.mtoken && MAINTENANCE_TOKEN && req.query.mtoken === MAINTENANCE_TOKEN) {
    return next()
  }

  return next(new Http401())
}

const authenticateClient = (req, res, next) => {
  let clients
  try {
    clients = require('../../../clients.json') // eslint-disable-line import/no-unresolved
  } catch (error) {
    clients = []
  }

  const token = req.headers.authorization ? req.headers.authorization.substr(6) : req.query.token
  if (!token) {
    return next()
  }

  req.apiClient = clients.find(client => client.token === token)
  if (!req.apiClient) {
    return next(new Http401())
  }

  next()
}

const authenticatedClient = (req, res, next) => {
  if (!req.apiClient) {
    return next(new Http401())
  }
  next()
}

const clientHasScope = scope => (req, res, next) => {
  if (!req.apiClient) {
    return next(new Http401())
  }

  if (!req.apiClient.scopes.includes(scope)) {
    return next(new Http403())
  }
  next()
}

module.exports = {
  isMaintenance,
  authenticateClient,
  authenticatedClient,
  clientHasScope
}
