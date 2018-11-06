'use strict'

const {getUserRoleInOrganization} = require('./udata')

function ensureLoggedIn(req, res, next) {
  if (!req.user) {
    return res.status(401).send()
  }
  next()
}

function isAdminOf(organizationIdExtractor) {
  return async (req, res, next) => {
    try {
      const organizationId = organizationIdExtractor(req)
      const userRole = await getUserRoleInOrganization(req.user.id, organizationId)

      if (userRole === 'admin') {
        return next()
      }

      res.status(403).send()
    } catch (error) {
      next(error)
    }
  }
}

function organizationIsSet(req, res, next) {
  if (!req.organization || req.organization.isNew) {
    return res.status(404).send()
  }
  next()
}

function isEditorOf(organizationIdExtractor) {
  return (req, res, next) => {
    const organizationId = organizationIdExtractor(req)
    getUserRoleInOrganization(req.user.id, organizationId)
      .then(userRole => {
        if (['admin', 'editor'].includes(userRole)) {
          return next()
        }
        res.sendStatus(403)
      })
      .catch(next)
  }
}

module.exports = {
  ensureLoggedIn,
  isAdminOf,
  isEditorOf,
  organizationIsSet
}
