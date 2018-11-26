const got = require('./got')

const {ROOT_URL} = process.env

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
  const {body} = await client.put(`/records/${recordId}/publications/dgv`, {
    json: true,
    body: publicationInfo
  })

  return body
}

function unsetRecordPublication(recordId) {
  return client.delete(`/records/${recordId}/publications/dgv`)
}

async function getPublications() {
  const {body} = await client.get('/publications/dgv', {
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
