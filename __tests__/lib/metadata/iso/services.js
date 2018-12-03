const {getWFSServiceLocation} = require('../../../../lib/metadata/iso/services')

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
})
