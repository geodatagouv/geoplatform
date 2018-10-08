const {getLicenseFromConstraints} = require('../../../../lib/metadata/iso/licenses')

describe('lib.metadata.iso.licenses', () => {
  describe('getLicenseFromConstraints()', () => {
    it('should detect ODbL', () => {
      const constraints = [
        {
          useLimitation: [
            'Licence OdBL http://www.openstreetmap.org/copyright/fr',
            'mention obligatoire "projet BANO ODbL"'
          ],
          accessConstraints: [
            'otherRestrictions'
          ],
          useConstraints: [
            'license'
          ],
          otherConstraints: [
            'Pas de restriction d’accès public'
          ]
        }
      ]

      expect(getLicenseFromConstraints(constraints)).toBe('odc-odbl')
    })
  })
})
