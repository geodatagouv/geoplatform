const mongoose = require('mongoose')
const debug = require('debug')('geoplatform:udata:jobs:udata-sync-all')

const {getPublications, unsetRecordPublication} = require('../../geogw')

const Dataset = mongoose.model('Dataset')

exports.handler = async function ({data}) {
  const publications = await getPublications()
  const publishedRecordIds = new Set(publications.map(p => p.recordId))

  const datasets = await Dataset.find().exec()

  await Promise.all(
    datasets.map(async dataset => {
      try {
        if (publishedRecordIds.has(dataset._id)) {
          publishedRecordIds.delete(dataset._id)
        } else {
          await dataset.notifyPublication()
        }

        await dataset.asyncUpdate(data)
      } catch (error) {
        debug(`${dataset._id}: Could not update published dataset`)
      }
    })
  )

  return Promise.all(
    [...publishedRecordIds].map(recordId => unsetRecordPublication(recordId))
  )
}
