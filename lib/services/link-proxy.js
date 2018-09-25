'use strict'

const got = require('got')

const {LINK_PROXY_URL} = process.env

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

module.exports = {proxyLink, getProxiedLink}
