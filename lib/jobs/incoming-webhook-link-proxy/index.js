'use strict'

const mongoose = require('mongoose')

const Record = mongoose.model('ConsolidatedRecord')

async function handleIncomingWebHook({data: {linkId}}) {
  const relatedRecordIds = await Record
    .distinct('recordId', {
      '_links.id': linkId
    })
    .exec()

  return Promise.all(
    relatedRecordIds.map(id => Record.triggerUpdated(id, 'link checked'))
  )
}

exports.handler = handleIncomingWebHook
