'use strict'

const request = require('superagent')
// const {enqueue} = require('delayed-jobs')

const baseURL = process.env.LINK_PROXY_URL
// const hookToken = process.env.LINK_ANALYZER_INCOMING_WEBHOOK_TOKEN

async function upsertLink(location) {
  const res = await request.post(baseURL + '/').send({location})
  return res.body
}

async function getProxiedLink(linkId) {
  const res = await request.get(baseURL + '/' + linkId)
  return res.body
}

function handleIncomingWebHook(req, res) {
  // if (!req.headers.authorization || req.headers.authorization !== `Basic ${hookToken}`) {
  //   return res.sendStatus(403)
  // }

  // const {eventName, linkId} = req.body

  // if (!eventName) {
  //   return res.sendStatus(400)
  // }
  // if (eventName !== 'check') {
  //   return res.sendStatus(200)
  // }

  // enqueue('incoming-webhook-link-analyzer', {eventName, linkId})
  //   .then(() => res.sendStatus(200))
  //   .catch(err => {
  //     console.error(err)
  //     res.sendStatus(500)
  //   })
}

module.exports = {upsertLink, getProxiedLink, handleIncomingWebHook}
