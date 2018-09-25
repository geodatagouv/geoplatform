'use strict'

const got = require('got')
const debug = require('debug')('geoplatform:services:link-proxy')
const {enqueue} = require('delayed-jobs')

const {LINK_PROXY_URL, LINK_PROXY_INCOMING_WEBHOOK_TOKEN} = process.env

async function proxyLink(location) {
  const {body} = await got.post(LINK_PROXY_URL, {
    json: true,
    body: {
      location
    }
  })

  return body
}

async function getProxiedLink(linkId) {
  const {body} = await got(`${LINK_PROXY_URL}/${linkId}`, {
    json: true
  })
  return body
}

async function handleIncomingWebHook(req, res) {
  if (!req.headers.authorization || req.headers.authorization !== `Basic ${LINK_PROXY_INCOMING_WEBHOOK_TOKEN}`) {
    return res.sendStatus(403)
  }

  const {check, links} = req.body

  if (check.state === 'finished' && check.statusCode === 200) {
    await Promise.all(
      links.map(async linkId => {
        try {
          await enqueue('incoming-webhook-link-proxy', {linkId, check})
        } catch (error) {
          console.error(error)
          debug(`Failed enqueing link-proxy job for link ${linkId} of check ${check.number} of ${check.linkId}`)
        }
      })
    )

    return res.sendStatus(200)
  }

  res.sendStatus(304)
}

module.exports = {proxyLink, getProxiedLink, handleIncomingWebHook}
