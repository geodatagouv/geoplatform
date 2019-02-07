const {Router} = require('express')

const router = new Router()

const {TRANSCODER_URL} = process.env

router.get(
  '/:linkId/downloads/:downloadId/download',
  (req, res) => {
    const {linkId, downloadId} = req.params
    const {search} = req._parsedUrl

    res.redirect(`${TRANSCODER_URL}/links/${linkId}/downloads/${downloadId}${search}`)
  }
)

module.exports = router
