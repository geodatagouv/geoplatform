const {convert} = require('../../../../lib/metadata/iso')

describe('lib.metadata.iso.index', () => {
  describe('convert()', () => {
    it('extract featureTypes from a service metadata', () => {
      expect(convert({
        hierarchyLevel: 'service',
        identificationInfo: {
          serviceType: 'download',
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
        },
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
      })).toMatchSnapshot()
    })
  })
})
