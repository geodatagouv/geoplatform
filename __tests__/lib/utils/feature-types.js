const {normalizeTypeName} = require('../../../lib/utils/feature-types')

describe('lib.utils.feature-types', () => {
  describe('normalizeTypeName', () => {
    it('should normalize the typeNames', () => {
      const testCases = [
        ['ABC:DEF:1234', 'def:1234'],
        ['abcdef', 'abcdef'],
        ['AZE_TYUP:TYUI_PP', 'tyui_pp'],
        ['ABCDEF', 'abcdef']
      ]

      for (const [source, expected] of testCases) {
        expect(normalizeTypeName(source)).toBe(expected)
      }
    })
  })
})
