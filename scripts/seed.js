#!/usr/bin/env node
require('dotenv').config()

const mongo = require('../lib/util/mongo')

async function main() {
  await mongo.connect()
  await mongo.db.collection('services').insertMany(require('../france/fixtures/dev/services'))
  await mongo.db.collection('catalogs').insertMany(require('../france/fixtures/dev/catalogs'))
  await mongo.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
