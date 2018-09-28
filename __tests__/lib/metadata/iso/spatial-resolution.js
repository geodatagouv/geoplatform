const {getSpatialResolution} = require('../../../../lib/metadata/iso/spatial-resolution')

function buildWithValues(value, unit) {
  return {
    identificationInfo: {
      spatialResolution: {
        distance: {value, unit}
      }
    }
  }
}

describe('lib.metadata.iso.spatial-resolution', () => {
  describe('getSpatialResolution()', () => {
    it('should return undefined when no value is provided', () => {
      expect(
        getSpatialResolution(buildWithValues(undefined, 'meter'))
      ).toBeUndefined()
    })

    it('should return undefined when NaN is passed', () => {
      expect(
        getSpatialResolution(buildWithValues(NaN, 'meter'))
      ).toBeUndefined()
    })

    it('should return value with unit when the unit is known', () => {
      const testCases = [
        ['rad', 'radian'],
        ['deg', 'degree']
      ]

      for (const [source, expected] of testCases) {
        expect(
          getSpatialResolution(buildWithValues(1, source))
        ).toEqual({
          value: 1,
          unit: expected
        })
      }
    })

    it('should default to meter when no unit is provided', () => {
      expect(
        getSpatialResolution(buildWithValues(1))
      ).toEqual({
        value: 1,
        unit: 'meter'
      })
    })
  })
})
