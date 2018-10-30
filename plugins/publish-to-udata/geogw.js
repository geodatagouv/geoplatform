'use strict'

const got = require('./got')

const ROOT_URL = process.env.GEOGW_URL + '/api/geogw'
const TOKEN = process.env.GEOGW_TOKEN
const TARGET = process.env.GEOGW_PUBLICATION_TARGET

function recordUrl(recordId) {
  return `${ROOT_URL}/records/${recordId}`
}

function publicationUrl(recordId) {
  return `${recordUrl(recordId)}/publications/${TARGET}`
}

exports.getRecord = async function (recordId) {
  const {body} = await got(recordUrl(recordId), {
    json: true
  })

  return body
}

exports.setRecordPublication = async function (recordId, publicationInfo) {
  const {body} = await got.put(publicationUrl(recordId), {
    headers: {
      authorization: `Basic ${TOKEN}`
    },
    json: true,
    body: publicationInfo
  })

  return body
}

exports.unsetRecordPublication = function (recordId) {
  return got.delete(publicationUrl(recordId), {
    headers: {
      authorization: `Basic ${TOKEN}`
    }
  })
}

exports.getPublications = async function () {
  const {body} = await got(`${ROOT_URL}/publications/${TARGET}`, {
    json: true
  })

  return body
}
