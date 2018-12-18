const {Router} = require('express')

const {listAll, list, show, publishOrUpdate, unpublish} = require('../controllers/publications')

const router = new Router()

router.get('/publications/dgv', listAll)

router.get('/records/:recordId/publications', list)

router.route('/records/:recordId/publications/dgv')
  .get(show)
  .put(publishOrUpdate)
  .delete(unpublish)

module.exports = router

