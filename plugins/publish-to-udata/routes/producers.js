const {Router} = require('express')

const organizations = require('../controllers/organizations')
const {fetch, list, associate, dissociate, listByOrganization} = require('../controllers/producers')
const {ensureLoggedIn, isAdminOf, organizationIsSet} = require('../middlewares')

const router = new Router()

router.param('organizationId', organizations.fetch)
router.param('producerId', fetch)

router.get('/producers', list)

/* Associations */

router.route('/organizations/:organizationId/producers')
  .post(ensureLoggedIn, organizationIsSet, isAdminOf(req => req.params.organizationId), associate)
  .get(listByOrganization)

router.route('/organizations/:organizationId/producers/:producerId')
  .delete(ensureLoggedIn, organizationIsSet, isAdminOf(req => req.params.organizationId), dissociate)

module.exports = router
