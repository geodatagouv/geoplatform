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

async function getLink(proxyId) {
  const {body} = await got(`${LINK_PROXY_URL}/${proxyId}`, {
    json: true
  })

  return body
}

async function getLinkByLocation(location) {
  const {body} = await got(`${LINK_PROXY_URL}`, {
    query: {
      location
    },
    json: true
  })

  return body
}

async function getLastCheck(proxyId) {
  const {body} = await got(`${LINK_PROXY_URL}/${proxyId}/checks`, {
    json: true
  })

  return body[0]
}

module.exports = {proxyLink, getLink, getLinkByLocation, getLastCheck}
