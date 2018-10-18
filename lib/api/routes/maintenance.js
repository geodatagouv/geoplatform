const {Router} = require('express')

const {isMaintenance} = require('../middlewares/auth')
const {electRecords, consolidateRecords, computeCatalogsMetrics} = require('../controllers/maintenance')

const router = new Router()

router.use(isMaintenance)

router.post('/elect-records', electRecords)
router.post('/consolidate-records', consolidateRecords)
router.post('/compute-catalogs-metrics', computeCatalogsMetrics)

module.exports = router
