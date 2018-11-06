'use strict'

const got = require('./got')

const {ROOT_URL} = process.env

const TOKEN = process.env.GEOGW_TOKEN
const TARGET = process.env.GEOGW_PUBLICATION_TARGET

const client = got.extend({
  baseUrl: `${ROOT_URL}/api/geogw`
})

async function getRecord(recordId) {
  const {body} = await client.get(`/records/${recordId}`, {
    json: true
  })

  return body
}

async function setRecordPublication(recordId, publicationInfo) {
  const {body} = await client.put(`/records/${recordId}/publications/${TARGET}`, {
    headers: {
      authorization: `Basic ${TOKEN}`
    },
    json: true,
    body: publicationInfo
  })

  return body
}

function unsetRecordPublication(recordId) {
  return client.delete(`/records/${recordId}/publications/${TARGET}`, {
    headers: {
      authorization: `Basic ${TOKEN}`
    }
  })
}

async function getPublications() {
  const {body} = await client.get(`${ROOT_URL}/publications/${TARGET}`, {
    json: true
  })

  return body
}

module.exports = {
  getRecord,
  setRecordPublication,
  unsetRecordPublication,
  getPublications
}
