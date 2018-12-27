const {Router} = require('express')

const {getLink} = require('../../services/link-proxy')
const ogr2ogr = require('../../extract/ogr2ogr')

const am = require('../middlewares/async')
const {Http404} = require('../errors')

const router = new Router()

router.get(
  '/:linkId/downloads/:downloadId/download',
  am(async (req, res, next) => {
    const link = await getLink(req.params.linkId)
    if (!link) {
      throw new Http404(`Link with id ${req.params.linkId} was not found`)
    }

    const download = link.downloads.find(d => d._id === req.params.downloadId)
    if (!download) {
      throw new Http404(`Download with id ${req.params.downloadId} was not found`)
    }

    const downloader = ogr2ogr.downloadDataset(download.url, {
      type: 'url',
      name: download.name,
      format: download.type
    })

    downloader(req, res, next)
  })
)

module.exports = router
