const mongoose = require('mongoose')
const Bluebird = require('bluebird')

const {getPublications, unsetRecordPublication} = require('../../geogw')

const Dataset = mongoose.model('Dataset')

exports.handler = async function ({data}) {
  const publications = await getPublications()
  const publishedRecordIds = new Set(publications.map(p => p.recordId))

  const datasets = await Dataset.find().exec()

  await Bluebird.map(datasets, async dataset => {
    if (publishedRecordIds.has(dataset._id)) {
      publishedRecordIds.delete(dataset._id)
    } else {
      await dataset.notifyPublication()
    }

    return dataset.asyncUpdate(data)
  }, {concurrency: 10})

  return Promise.all(
    [...publishedRecordIds].map(recordId => unsetRecordPublication(recordId))
  )
}
