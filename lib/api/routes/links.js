const {createWriteStream} = require('fs')
const {join} = require('path')
const {Router} = require('express')
const unzipper = require('unzipper')
const got = require('got')
const pump = require('pump')

const {getProxiedLink} = require('../../services/link-proxy')
const {createTempDirectory} = require('../../util/tempfile')
const ogr2ogr = require('../../extract/ogr2ogr')

const router = new Router()

function unzipFile(url, tmp) {
  return new Promise((resolve, reject) => {
    pump(
      got.stream(url),
      new unzipper.Extract({
        path: tmp
      }),
      error => {
        if (error) {
          return reject(error)
        }

        resolve()
      }
    )
  })
}

function downloadFile(url, path) {
  return new Promise((resolve, reject) => {
    pump(
      got.stream(url),
      createWriteStream(path),
      error => {
        if (error) {
          return reject(error)
        }

        resolve()
      }
    )
  })
}

router.get(
  '/:linkId/downloads/:downloadId/download',
  async (req, res) => {
    const link = await getProxiedLink(req.params.linkId)
    if (!link) {
      return res.status(404).send({
        code: 404,
        message: `Link with id ${req.params.linkId} was not found`
      })
    }

    const download = link.downloads.find(d => d._id === req.params.downloadId)
    if (!download) {
      return res.status(404).send({
        code: 404,
        message: `Download with id ${req.params.downloadId} was not found`
      })
    }

    const tmp = await createTempDirectory()
    const path = join(tmp, download.name)

    if (download.archive) {
      await unzipFile(download.url, tmp)
    } else {
      await downloadFile(download.url, path)
    }

    req.ogr2ogr = {
      src: tmp,
      fileName: download.name,
      cleanup: true
    }

    ogr2ogr.downloadDataset(req, res)
  }
)

module.exports = router
