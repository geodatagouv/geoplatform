const {getAllContacts} = require('../../../../lib/metadata/iso/contacts')

describe('lib.metadata.iso.contacts', () => {
  describe('getAllContacts()', () => {
    it('should return contacts array when called with representative metadata', () => {
      const metadata = {
        contact: {
          organisationName: 'Tralala',
          individualName: 'Régis',
          role: 'OWNER',
          contactInfo: {
            address: {
              deliveryPoint: '1 rue République',
              postalCode: '75015',
              city: 'Paris 15e',
              electronicMailAddress: 'info@acme.org',
              country: 'Groland'
            },
            phone: {
              voice: '0147200001',
              facSimile: '3615'
            }
          }
        },
        identificationInfo: {
          pointOfContact: [
            {
              organisationName: 'ACME'
            },
            {
              individualName: 'AAA'
            }
          ]
        }
      }

      expect(getAllContacts(metadata)).toMatchSnapshot()
    })
  })
})
