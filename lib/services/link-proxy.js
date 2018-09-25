'use strict'

const request = require('superagent')
const debug = require('debug')('geoplatform:services:link-proxy')
const {enqueue} = require('delayed-jobs')

const {LINK_PROXY_URL, LINK_PROXY_INCOMING_WEBHOOK_TOKEN} = process.env

async function proxyLink(location) {
  const res = await request.post(LINK_PROXY_URL).send({location})
  return res.body
}

async function getProxiedLink(linkId) {
  const res = await request.get(`${LINK_PROXY_URL}/${linkId}`)
  return res.body
}

async function getLastCheck(linkId) {
  const res = await request.get(`${LINK_PROXY_URL}/${linkId}/checks`)
  return res.body[0]
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

module.exports = {proxyLink, getLastCheck, getProxiedLink, handleIncomingWebHook}
