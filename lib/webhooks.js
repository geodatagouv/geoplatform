const {Router, json} = require('express')
const debug = require('debug')('geoplatform:webhooks')
const {enqueue} = require('bull-manager')

const sentry = require('./utils/sentry')

const {LINK_PROXY_INCOMING_WEBHOOK_TOKEN} = process.env

const router = new Router()

router.use(json())

router.post(
  '/link-proxy',
  async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization !== `Basic ${LINK_PROXY_INCOMING_WEBHOOK_TOKEN}`) {
      return res.status(403).send()
    }

    const {check, links} = req.body

    if (check.state === 'finished' && check.statusCode === 200) {
      await Promise.all(
        links.map(async linkId => {
          try {
            await enqueue('incoming-webhook-link-proxy', {
              name: check.location,
              linkId,
              check
            })
          } catch (error) {
            sentry.captureException(error)
            debug(`Failed enqueing link-proxy job for link ${linkId} of check ${check.number} of ${check.linkId}`)
          }
        })
      )

      return res.status(200).send()
    }

    res.status(304).send()
  }
)

module.exports = router
