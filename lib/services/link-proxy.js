'use strict'

const request = require('superagent')
const debug = require('debug')('geoplatform:services:link-proxy')
const {enqueue} = require('delayed-jobs')

const baseURL = process.env.LINK_PROXY_URL
const hookToken = process.env.LINK_PROXY_INCOMING_WEBHOOK_TOKEN

async function proxyLink(location) {
  const res = await request.post(baseURL + '/').send({location})
  return res.body
}

async function getProxiedLink(linkId) {
  const res = await request.get(baseURL + '/' + linkId)
  return res.body
}

async function handleIncomingWebHook(req, res) {
  if (!req.headers.authorization || req.headers.authorization !== `Basic ${hookToken}`) {
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
