const {join} = require('path')
const fileType = require('file-type')
const fresh = require('fresh')
const cacheControl = require('@tusbar/cache-control')

const got = require('../../got')

const defaultThumbnailPath = join(__dirname, '../../../france/img/unavailable-thumbnail.png')

const ACCEPTED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif'
]

module.exports = url => (req, res) => {
  got
    .stream(url, {
      timeout: 10 * 1000
    })
    .on('error', () => {
      if (!res.headersSent) {
        res.set('Content-Type', 'image/png')
        res.sendFile(defaultThumbnailPath)
      }
    })
    .on('response', response => {
      response.once('data', chunk => {
        response.pause()

        const type = fileType(chunk)

        if (!type || !ACCEPTED_MIME_TYPES.includes(type.mime)) {
          response.destroy()
          return response.emit('error', new Error('Invalid mime type'))
        }

        if (fresh(req.headers, {
          etag: response.headers.etag,
          'last-modified': response.headers['last-modified']
        })) {
          response.destroy()
          return res.status(304).end()
        }

        res.set('Content-Type', type.mime)
        if (response.headers['content-length']) {
          res.set('Content-Length', response.headers['content-length'])
        }

        if (response.headers.etag) {
          res.set('ETag', response.headers.etag)
        }

        if (response.headers['last-modified']) {
          res.set('Last-Modified', response.headers['last-modified'])
        }

        res.set('Cache-Control', cacheControl.format({
          public: true,
          maxAge: 30 * 24 * 60 * 60 // 30 days
        }))

        res.write(chunk)
        response.pipe(res)
      })
    })
    .resume()
}
