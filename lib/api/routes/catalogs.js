const {Router} = require('express')

const {fetch, show, list, destroy, update} = require('../controllers/catalogs')
const {isMaintenance} = require('./middlewares/auth')

const router = new Router()

router.param('catalogId', fetch)

router.route('/:catalogId')
  .get(show)
  .put(isMaintenance, update)
  .delete(isMaintenance, destroy)

router.route('/').get(list)

module.exports = router
