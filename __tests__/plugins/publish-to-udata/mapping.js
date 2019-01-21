const mapping = require('../../../plugins/publish-to-udata/mapping')

describe('plugins.publish-to-udata.mapping', () => {
  describe('map()', () => {
    it('should map fixtures', () => {
      const fixtures = [
        'a9bcb983f29b66004c29c0cb3e0782b4cb1e663e',
        'da40697278592843273355722d08ca2db742a902'
      ]

      expect.assertions(fixtures.length)

      for (const fixture of fixtures) {
        const record = require(`./__fixtures__/mapping/${fixture}`)

        expect(mapping.map(record)).toMatchSnapshot()
      }
    })
  })
})
