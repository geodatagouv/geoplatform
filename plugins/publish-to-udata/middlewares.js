const am = require('../../lib/api/middlewares/async')
const {Http403, Http404} = require('../../lib/api/errors')

const {getUserRoleInOrganization} = require('./udata')

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return res.status(401).send()
  }
  next()
}

function isAdminOf(organizationIdExtractor) {
  return am(async (req, res, next) => {
    const organizationId = organizationIdExtractor(req)
    const userRole = await getUserRoleInOrganization(req.user.id, organizationId)

    if (userRole === 'admin') {
      return next()
    }

    throw new Http403()
  })
}

function organizationIsSet(req, res, next) {
  if (!req.organization || req.organization.isNew) {
    return next(new Http404())
  }

  next()
}

function isEditorOf(organizationIdExtractor) {
  return am(async (req, res, next) => {
    const organizationId = organizationIdExtractor(req)
    const userRole = await getUserRoleInOrganization(req.user.id, organizationId)

    if (['admin', 'editor'].includes(userRole)) {
      return next()
    }

    throw new Http403()
  })
}

module.exports = {
  ensureLoggedIn,
  isAdminOf,
  isEditorOf,
  organizationIsSet
}
