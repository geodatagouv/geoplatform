const got = require('./got')

const {DATAGOUV_URL, UDATA_PUBLICATION_USER_API_KEY} = process.env

const client = got.extend({
  baseUrl: `${DATAGOUV_URL}/api/1`
})

async function getProfile(accessToken) {
  const {body} = await client.get('/me/', {
    json: true,
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  })

  return body
}

async function getOrganization(organizationId) {
  const {body} = await client.get(`/organizations/${organizationId}/`, {
    json: true
  })

  return body
}

async function addUserToOrganization(userId, organizationId, accessToken) {
  try {
    await client.post(`/organizations/${organizationId}/member/${userId}`, {
      json: true,
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      body: {
        role: 'admin'
      }
    })
  } catch (error) {
    if (error.statusCode === 409) {
      // User is already a member, ignoring
      return
    }

    throw error
  }
}

async function removeUserFromOrganization(userId, organizationId, accessToken) {
  await client.delete(`/organizations/${organizationId}/member/${userId}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-length': 0
    }
  })
}

async function getUserRoleInOrganization(userId, organizationId) {
  const organization = await getOrganization(organizationId)

  const membership = organization.members.find(
    membership => membership.user.id === userId
  )

  return membership ? membership.role : 'none'
}

async function deleteDatasetResource(datasetId, resourceId) {
  await client.delete(`/datasets/${datasetId}/resources/${resourceId}/`, {
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY,
      'content-length': 0
    }
  })
}

async function createDataset(dataset) {
  const {body} = await client.post('/datasets/', {
    json: true,
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY
    },
    body: dataset
  })

  return body
}

async function updateDataset(datasetId, dataset) {
  const {body} = await client.put(`/datasets/${datasetId}/`, {
    json: true,
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY
    },
    body: dataset
  })

  if (dataset.resources.length > 0) {
    return body
  }

  await Promise.all(
    body.resources.map(resource => deleteDatasetResource(datasetId, resource.id))
  )

  return getDataset(datasetId)
}

async function getDataset(datasetId) {
  const {body} = await client.get(`/datasets/${datasetId}/`, {
    json: true,
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY
    }
  })

  return body
}

async function deleteDataset(datasetId) {
  await client.delete(`/datasets/${datasetId}/`, {
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY,
      'content-length': 0
    }
  })
}

async function createDatasetTransferRequest(datasetId, recipientOrganizationId) {
  const {body} = await client.post('/transfer/', {
    json: true,
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY
    },
    body: {
      subject: {
        id: datasetId,
        class: 'Dataset'
      },
      recipient: {
        id: recipientOrganizationId,
        class: 'Organization'
      },
      comment: 'INSPIRE gateway automated transfer: request'
    }
  })

  return body.id
}

async function respondTransferRequest(transferId, response = 'accept') {
  await client.post(`/transfer/${transferId}/`, {
    json: true,
    headers: {
      'X-API-KEY': UDATA_PUBLICATION_USER_API_KEY
    },
    body: {
      comment: 'INSPIRE gateway automated transfer: response',
      response
    }
  })
}

async function transferDataset(datasetId, recipientOrganizationId) {
  try {
    await getDataset(datasetId)
  } catch (error) {
    throw new Error('Dataset doesn’t exist')
  }

  try {
    const transferId = await createDatasetTransferRequest(datasetId, recipientOrganizationId)

    await respondTransferRequest(transferId)
  } catch (error) {
    if (error.statusCode === 400 && error.body.message === 'Recipient should be different than the current owner') {
      // Swallow this error…
    } else {
      throw error
    }
  }
}

module.exports = {
  getOrganization,
  addUserToOrganization,
  removeUserFromOrganization,
  getProfile,
  createDataset,
  updateDataset,
  deleteDataset,
  getDataset,
  getUserRoleInOrganization,
  transferDataset
}
