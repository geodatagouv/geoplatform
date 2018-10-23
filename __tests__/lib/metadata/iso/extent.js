const {getCoveredTerritories, getConsolidatedExtent} = require('../../../../lib/metadata/iso/extent')

describe('lib.metadata.iso.extent', () => {
  describe('getCoveredTerritories()', () => {
    it('should return an empty array if not defined', () => {
      expect(getCoveredTerritories({})).toEqual([])
    })

    it('should return an empty array if not geographicElement is defined', () => {
      expect(getCoveredTerritories({
        identificationInfo: {
          extent: [{}, {}]
        }
      })).toEqual([])
    })

    it('should match fr:region:93', () => {
      expect(getCoveredTerritories({
        identificationInfo: {
          extent: [{
            geographicElement: {
              westBoundLongitude: 4.21911199683101,
              eastBoundLongitude: 7.818162622198166,
              southBoundLatitude: 43.0377552055724,
              northBoundLatitude: 45.0667722061971
            }
          }]
        }
      })).toEqual([
        'fr:region:93'
      ])
    })
  })

  describe('getConsolidatedExtent()', () => {
    it('should return null if not defined', () => {
      expect(getConsolidatedExtent({})).toBeNull()
    })

    it('should return null if not geographicElement is defined', () => {
      expect(getConsolidatedExtent({
        identificationInfo: {
          extent: [{}, {}]
        }
      })).toBeNull()
    })

    it('should return a GeoJSON polygon of the extent', () => {
      expect(getConsolidatedExtent({
        identificationInfo: {
          extent: [{
            geographicElement: {
              westBoundLongitude: 4.21911199683101,
              eastBoundLongitude: 7.818162622198166,
              southBoundLatitude: 43.0377552055724,
              northBoundLatitude: 45.0667722061971
            }
          }]
        }
      })).toMatchSnapshot()
    })
  })
})
