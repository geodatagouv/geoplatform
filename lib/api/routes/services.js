const {Router} = require('express')

const services = require('../controllers/services')
const featureTypes = require('../controllers/feature-types')

const {TRANSCODER_URL} = process.env

const router = new Router()

router.param('serviceId', services.service)
router.param('syncId', services.sync)
router.param('typeName', featureTypes.featureType)

router.get('/', services.list)
router.post('/', services.create)
router.get('/:serviceId', services.show)

router.post('/:serviceId/sync', services.handleSync)

router.get('/:serviceId/synchronizations', services.listSyncs)
router.get('/:serviceId/synchronizations/:syncId', services.showSync)

router.get('/by-protocol/:protocol', services.list)
router.post('/by-protocol/:protocol/sync-all', services.syncAllByProtocol)

router.get('/:serviceId/feature-types', featureTypes.list)
router.get('/:serviceId/feature-types/:typeName', featureTypes.show)
router.get('/:serviceId/feature-types/:typeName/download', (req, res) => {
  const {serviceId, typeName} = req.params
  const {search} = req._parsedUrl

  res.redirect(`${TRANSCODER_URL}/services/${serviceId}/feature-types/${typeName}${search}`)
})

module.exports = router
