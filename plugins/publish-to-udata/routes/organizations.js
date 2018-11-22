const {Router} = require('express')

const {fetch, list, show, createOrUpdate, showProfile} = require('../controllers/organizations')
const {ensureLoggedIn, isAdminOf} = require('../middlewares')

const router = new Router()

router.param('organizationId', fetch)

router.route('/organizations/:organizationId')
  .get(show)
  .put(ensureLoggedIn, isAdminOf(req => req.params.organizationId), createOrUpdate)

router.get('/organizations/:organizationId/profile', showProfile)

router.get('/organizations', list)

module.exports = router
