const {getDates} = require('../../../../lib/metadata/iso/dates')

describe('lib.metadata.iso.dates', () => {
  describe('getDates()', () => {
    it('should extract dates', () => {
      const record = {
        identificationInfo: {
          citation: {
            date: [
              {
                date: '1980-01-01'
              },
              {
                date: 'lol',
                dateType: 'creation'
              },
              {
                date: '2000-01-01',
                dateType: 'creation'
              },
              {
                date: '2005-01-01',
                dateType: 'creation'
              },
              {
                date: '2010-01-01',
                dateType: 'revision'
              },
              {
                date: '2012-01-01',
                dateType: 'revision'
              }
            ]
          }
        }
      }
      expect(getDates(record)).toEqual({
        creationDate: '2000-01-01',
        revisionDate: '2012-01-01'
      })
    })
  })
})
