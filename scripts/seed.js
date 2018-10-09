#!/usr/bin/env node
require('dotenv').config()

const mongo = require('../lib/utils/mongo')

async function main() {
  await mongo.connect()

  await Promise.all(
    require('../france/fixtures/dev/services').map(async service => {
      try {
        await mongo.db.collection('services').insertOne(service)
        console.log(`[+] services: inserted ${service.location}`)
      } catch (error) {
        console.log(`[-] services: failed inserting ${service.location}`)
      }
    })
  )

  await Promise.all(
    require('../france/fixtures/dev/catalogs').map(async catalog => {
      try {
        await mongo.db.collection('catalogs').insertOne(catalog)
        console.log(`[+] catalogs: inserted ${catalog.name}`)
      } catch (error) {
        console.log(`[-] catalogs: failed inserting ${catalog.name}`)
      }
    })
  )

  await mongo.disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
