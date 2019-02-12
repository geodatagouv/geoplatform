const {ObjectId} = require('mongodb')

const {getLicenseFromLinks, getLicenseFromCatalogs} = require('../../../../lib/metadata/common/licenses')

describe('lib.metadata.common.licenses', () => {
  describe('getLicenseFromLinks()', () => {
    it('should return undefined if called with an empty array', () => {
      const result = getLicenseFromLinks([])
      expect(result).toBeUndefined()
    })

    it('should return the appropriate license', () => {
      const testCases = [
        ['Licence ouverte (Etalab)', 'lov2']
      ]

      for (const [source, expected] of testCases) {
        expect(getLicenseFromLinks([{
          name: source
        }])).toBe(expected)
      }
    })
  })

  describe('getLicenseFromCatalogs()', () => {
    it('should return null if called with an empty array', () => {
      const result = getLicenseFromCatalogs([])
      expect(result).toBeNull()
    })

    it('should return null if called with a non-open catalog', () => {
      const testCases = [
        [
          new ObjectId()
        ],
        [
          new ObjectId('000000000000000000000000')
        ],
        [
          new ObjectId(),
          new ObjectId('000000000000000000000000')
        ]
      ]

      for (const testCase of testCases) {
        expect(getLicenseFromCatalogs(testCase)).toBeNull()
      }
    })

    it('should return the lov2 if called with an open catalog', () => {
      const testCases = [
        [
          new ObjectId(),
          new ObjectId('54f5a39a62781800bf6db9e6')
        ],
        [
          new ObjectId('54f5a39a62781800bf6db9e6')
        ],
        [
          new ObjectId('53a01c3c23a9836106440e0f')
        ],
        [
          new ObjectId('54f5a39a62781800bf6db9e6'),
          new ObjectId('53a01c3c23a9836106440e0f')
        ]
      ]

      for (const testCase of testCases) {
        expect(getLicenseFromCatalogs(testCase)).toBe('lov2')
      }
    })
  })
})
