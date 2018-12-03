const {getLicenseFromLinks} = require('../../../../lib/metadata/common/licenses')

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
})
