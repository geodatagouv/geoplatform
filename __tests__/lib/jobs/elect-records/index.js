const mongoose = require('mongoose')
const j2m = require('json2mongo')

mongoose.set('useNewUrlParser', true)
mongoose.set('useFindAndModify', false)
mongoose.set('useCreateIndex', true)

const NAME = 'test-jobs-elect-records'

jest.mock('bull-manager', () => ({
  enqueue: jest.fn()
}))

let handler

beforeAll(async () => {
  await mongoose.connect(`mongodb://localhost:27017/${NAME}`, {
    autoIndex: true,
    reconnectTries: 1
  })

  /* eslint-disable import/no-unassigned-import */
  require('../../../../lib/models/CatalogRecord')
  require('../../../../lib/models/RecordRevision')
  require('../../../../lib/models/ConsolidatedRecord');
  /* eslint-enable import/no-unassigned-import */

  ({handler} = require('../../../../lib/jobs/elect-record'))
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

describe('jobs.elect-records', () => {
  it('should elect the most recent record', async () => {
    const CatalogRecord = mongoose.model('CatalogRecord')
    const RecordRevision = mongoose.model('RecordRevision')

    const recordId = 'recordId-1'
    const dates = [
      new Date(2018, 8, 1),
      new Date(2017, 8, 1)
    ]

    await Promise.all(
      dates.map(async (revisionDate, index) => {
        await CatalogRecord.upsert({
          recordId,
          recordHash: `recordHash-${index}`,
          catalog: new mongoose.mongo.ObjectId(),
          revisionDate
        })

        await RecordRevision.upsert({
          recordId,
          recordHash: `recordHash-${index}`,
          recordType: 'MD_Metadata',
          revisionDate
        })
      })
    )

    await handler({
      data: {
        recordId
      }
    })

    const featured = await RecordRevision.collection.findOne({
      recordId,
      featured: true
    })

    expect(featured.recordHash).toBe('recordHash-0')
  })

  it('should elect a new version for fac934f5b6934af22dc56b1651e02f5dbda782c6', async () => {
    const CatalogRecord = mongoose.model('CatalogRecord')
    const RecordRevision = mongoose.model('RecordRevision')

    const recordId = 'fac934f5b6934af22dc56b1651e02f5dbda782c6'

    const records = require('./__fixtures__/fac934f5b6934af22dc56b1651e02f5dbda782c6/catalog-records')
    const revisions = require('./__fixtures__/fac934f5b6934af22dc56b1651e02f5dbda782c6/record-revisions')

    await Promise.all(
      records.map(record => CatalogRecord.collection.insertOne(j2m(record)))
    )

    await Promise.all(
      revisions.map(revision => RecordRevision.collection.insertOne(j2m(revision)))
    )

    await handler({
      data: {
        recordId
      }
    })

    let featured = await RecordRevision.collection.findOne({
      recordId,
      featured: true
    })

    // Should change the featured record
    expect(featured.recordHash).toBe('f9c19ab9f60f0cd7e27161a099c402c7437cf828')

    await handler({
      data: {
        recordId
      }
    })

    featured = await RecordRevision.collection.findOne({
      recordId,
      featured: true
    })

    // Should not change the featured record
    expect(featured.recordHash).toBe('f9c19ab9f60f0cd7e27161a099c402c7437cf828')
  })
})
