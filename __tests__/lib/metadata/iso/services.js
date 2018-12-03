const {getWFSServiceLocation, getCoupledResources} = require('../../../../lib/metadata/iso/services')

describe('lib.metadata.iso.services', () => {
  describe('getWFSServiceLocation()', () => {
    it('should return the service URL', () => {
      const metadata = {
        distributionInfo: {
          transferOptions: [
            {
              onLine: [
                {
                  linkage: 'https://example.com/wfs?SERVICE=WFS&REQUEST=GetCapabilities&',
                  protocol: 'OGC:WFS-2.0.0-http-get-capabilities'
                }
              ]
            }
          ]
        }
      }

      expect(getWFSServiceLocation(metadata)).toBe('https://example.com/wfs')
    })

    it('should return null if there are no WFS service detected', () => {
      const metadata = {
        distributionInfo: {
          transferOptions: [
            {
              onLine: [
                {
                  linkage: 'https://example.com/random'
                }
              ]
            }
          ]
        }
      }

      expect(getWFSServiceLocation(metadata)).toBeNull()
    })

    it('should return null if the WFS service is not a valid url', () => {
      const testCases = [
        'https://example.unknowntld/wfs?SERVICE=WFS&REQUEST=GetCapabilities',
        'https://127.0.0.1/wfs?SERVICE=WFS&REQUEST=GetCapabilities',
        '/wfs?SERVICE=WFS&REQUEST=GetCapabilities',
        'ftp://example.com/wfs?SERVICE=WFS&REQUEST=GetCapabilities',
        'foobar'
      ]

      for (const linkage of testCases) {
        expect(getWFSServiceLocation({
          distributionInfo: {
            transferOptions: [
              {
                onLine: [
                  {
                    linkage,
                    protocol: 'OGC:WFS-2.0.0-http-get-capabilities'
                  }
                ]
              }
            ]
          }
        })).toBeNull()
      }
    })

    it('should return null if there are multiple WFS services listed', () => {
      const metadata = {
        distributionInfo: {
          transferOptions: [
            {
              onLine: [
                {
                  linkage: 'https://example.com/wfs-1?SERVICE=WFS&REQUEST=GetCapabilities&',
                  protocol: 'OGC:WFS-2.0.0-http-get-capabilities'
                },
                {
                  linkage: 'https://example.com/wfs-2?SERVICE=WFS&REQUEST=GetCapabilities&',
                  protocol: 'OGC:WFS-2.0.0-http-get-capabilities'
                }
              ]
            }
          ]
        }
      }

      expect(getWFSServiceLocation(metadata)).toBeNull()
    })
  })

  describe('getCoupledResources()', () => {
    it('should return the coupled resources', () => {
      const metadata = {
        identificationInfo: {
          coupledResource: [
            {
              operationName: 'GetFeature',
              identifier: 'foo1',
              scopedName: 'feature_type-1'
            },
            {
              operationName: 'GetFeature',
              identifier: 'foo2',
              scopedName: 'feature_type-2'
            }
          ]
        }
      }

      expect(getCoupledResources(metadata)).toMatchSnapshot()
    })

    it('should dedup duplicated coupled resources', () => {
      const metadata = {
        identificationInfo: {
          coupledResource: [
            {
              operationName: 'GetCapabilities',
              identifier: '9fd801e3-976a-49b6-b84a-0bd448fec8d5',
              scopedName: 'bati_avap_paimpol'
            },
            {
              operationName: 'DescribeFeatureType',
              identifier: '9fd801e3-976a-49b6-b84a-0bd448fec8d5',
              scopedName: 'bati_avap_paimpol'
            },
            {
              operationName: 'GetFeature',
              identifier: '9fd801e3-976a-49b6-b84a-0bd448fec8d5',
              scopedName: 'bati_avap_paimpol'
            },
            {
              operationName: 'GetCapabilities',
              identifier: 'e3b34f32-8081-4451-83e0-4d5fcfd36512',
              scopedName: 'elr_avap_paimpol'
            },
            {
              operationName: 'DescribeFeatureType',
              identifier: 'e3b34f32-8081-4451-83e0-4d5fcfd36512',
              scopedName: 'elr_avap_paimpol'
            }
          ]
        }
      }

      expect(getCoupledResources(metadata)).toMatchSnapshot()
    })

    it('should ignore incomplete resources', () => {
      const metadata = {
        identificationInfo: {
          coupledResource: [
            {
              operationName: 'GetFeature',
              identifier: 'foo1'
            },
            {
              identifier: 'foo2',
              scopedName: 'feature_type-2'
            },
            {
              scopedName: 'feature_type-3'
            }
          ]
        }
      }

      expect(getCoupledResources(metadata)).toMatchSnapshot()
    })

    it('should return an empty array if there are no coupled resources', () => {
      const testCases = [
        [],
        null,
        undefined
      ]

      for (const coupledResource of testCases) {
        expect(getCoupledResources({
          identificationInfo: {
            coupledResource
          }
        })).toEqual([])
      }
    })
  })
})
