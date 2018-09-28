const {normalizeName} = require('../../france/producer')

describe('france.producer', () => {
  describe('normalizeName()', () => {
    it('should return the same string for unknown or valid typography', () => {
      expect(normalizeName('This is a test')).toBe('This is a test')
    })

    it('should update the name', () => {
      const testCases = [
        ['DEAL Mayotte / SDDT / PDT', 'DEAL Mayotte']
      ]

      for (const [source, expected] of testCases) {
        expect(normalizeName(source)).toBe(expected)
      }
    })

    it('should throw an error if the value is erroneous', () => {
      expect(
        () => normalizeName('-- Organisation --')
      ).toThrow('Rejected value')
    })
  })
})
