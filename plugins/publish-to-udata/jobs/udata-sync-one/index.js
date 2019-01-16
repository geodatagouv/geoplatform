const mongoose = require('mongoose')
const debug = require('debug')('geoplatform:udata:jobs:udata-sync-one')
const {enqueue} = require('bull-manager')

const Dataset = mongoose.model('Dataset')

exports.handler = async function ({data}) {
  const {
    recordId,
    organizationId,
    unpublishIfRecordNotFound,
    removeIfTargetDatasetNotFound
  } = data
  let {action} = data

  let publicationInfo = await Dataset.findById(recordId).exec()

  if (!publicationInfo && action && ['update', 'unpublish'].includes(action)) {
    throw new Error('Cannot update or unpublish a non published dataset')
  }

  if (publicationInfo && !action) {
    action = 'update'
  }

  if (!publicationInfo && !action) {
    action = 'publish'
  }

  if (!publicationInfo) {
    publicationInfo = new Dataset({
      _id: recordId,
      'publication.organization': organizationId
    })
  }

  try {
    await publicationInfo[action]()

    if (action !== 'update') {
      await enqueue('index-record', `publication: ${action}`, {
        recordId
      })
    }

    debug(`${recordId}: Published successfully`)
  } catch (error) {
    if (error.message === 'Unchanged dataset') {
      debug(`${recordId}: Unchanged dataset`)
      return null
    }

    if (unpublishIfRecordNotFound === true && error.message === 'Record not found' && action === 'update') {
      debug(`${recordId}: Source record not found. Going to unpublish the related dataset…`)
      return publicationInfo.unpublish()
    }

    if (removeIfTargetDatasetNotFound === true && error.message === 'Target dataset doesn’t exist anymore' && action === 'update') {
      debug(`${recordId}: Target dataset not found. Going to remove the publication info…`)
      return publicationInfo.removeAndNotify()
    }

    throw error
  }
}
