const {getFileNameFromHref} = require('../../../../lib/metadata/common/util')

describe('lib.metadata.common.util', () => {
  describe('getFileNameFromHref()', () => {
    it('should return null if href is falsy', () => {
      const testCases = [
        null,
        undefined,
        ''
      ]

      for (const source of testCases) {
        expect(getFileNameFromHref(source)).toBeNull()
      }
    })
  })
})
