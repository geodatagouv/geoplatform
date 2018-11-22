const {Router} = require('express')

const {Http400} = require('../../../lib/api/errors')

const organizations = require('../controllers/organizations')
const {
  fetch,
  publish,
  unpublish,
  globalMetrics,
  metrics,
  published,
  notPublishedYet,
  publishedByOthers,
  synchronizeAll
} = require('../controllers/datasets')

const {ensureLoggedIn, isEditorOf, organizationIsSet} = require('../middlewares')

function isPublished(req, res, next) {
  if (req.publicationInfo) {
    return next()
  }

  next(new Http400())
}

function isNotPublished(req, res, next) {
  if (!req.publicationInfo) {
    return next()
  }

  next(new Http400())
}

function validatePublicationParams(req, res, next) {
  if (req.body.organization) {
    return next()
  }

  next(new Http400())
}

const router = new Router()

router.param('organizationId', organizations.fetch)
router.param('datasetId', fetch)

router.route('/datasets/:datasetId/publication')
  .all(ensureLoggedIn)
  .put(isNotPublished, validatePublicationParams, isEditorOf(req => req.body.organization), publish)
  .delete(isPublished, isEditorOf(req => req.publicationInfo.publication.organization.toString()), unpublish)

router.get('/datasets/metrics', globalMetrics)
router.get('/organizations/:organizationId/datasets/metrics', organizationIsSet, metrics)

router.get('/organizations/:organizationId/datasets/not-published-yet', organizationIsSet, notPublishedYet)
router.get('/organizations/:organizationId/datasets/published', organizationIsSet, published)
router.get('/organizations/:organizationId/datasets/published-by-others', organizationIsSet, publishedByOthers)

router.post('/datasets/synchronize-all', synchronizeAll)

module.exports = router
