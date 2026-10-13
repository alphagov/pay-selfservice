import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import type { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'

type AdyenDetailsService = typeof import('./adyen-details.service')

describe('Adyen details service', () => {
  let service: AdyenDetailsService

  const legalEntityClientMock = {
    createLegalEntity: sinon.stub(),
    getLegalEntity: sinon.stub(),
    updateLegalEntity: sinon.stub(),
  }

  const connectorClientMock = {
    gatewayAccounts: {
      patchCredentialsByServiceExternalIdAndAccountType: sinon.stub().resolves({}),
    },
  }

  class ConnectorClientStub {
    gatewayAccounts = connectorClientMock.gatewayAccounts
  }

  before(() => {
    service = proxyquire<AdyenDetailsService>('./adyen-details.service', {
      '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class': {
        GatewayAccountCredentialUpdateRequest: class {},
      },
      '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
      '@services/clients/adyen/adyen-legal-entity-management.client': legalEntityClientMock,
    })
  })

  afterEach(() => {
    sinon.resetHistory()
  })

  describe('createLegalEntity', () => {
    const ORGANISATION_TYPE = 'organization'

    const fullOrganisationSession = {
      organisationName: 'Test Org Ltd',
      addressLine1: '1 Test Street',
      addressLine2: 'Test Building',
      addressCity: 'London',
      addressPostcode: 'SW1A 1AA',
      addressCountry: 'GB',
      companyRegistrationNumber: '12345678',
      vatRegistrationNumber: 'GB123456789',
    } as OrganisationDetailsSession

    it('should create Adyen legal entity for an organisation', async () => {
      const legalEntity = { id: 'LE123', type: ORGANISATION_TYPE }
      legalEntityClientMock.createLegalEntity.resolves(legalEntity)

      const result = await service.createOrganisation(fullOrganisationSession)

      sinon.assert.calledOnce(legalEntityClientMock.createLegalEntity)

      expect(legalEntityClientMock.createLegalEntity.firstCall.args[0]).to.deep.equal({
        type: ORGANISATION_TYPE,
        organization: {
          legalName: 'Test Org Ltd',
          registeredAddress: {
            street: '1 Test Street',
            street2: 'Test Building',
            city: 'London',
            postalCode: 'SW1A 1AA',
            country: 'GB',
          },
          registrationNumber: '12345678',
          vatNumber: 'GB123456789',
        },
      })

      expect(result).to.equal(legalEntity)
    })
  })

  describe('createResponsiblePerson', () => {
    const ORGANISATION_LEGAL_ENTITY_ID = 'LE_ORG_123'
    const PERSON_LEGAL_ENTITY_ID = 'LE_PERSON_456'

    const fullResponsiblePersonSession = {
      firstName: 'John',
      lastName: 'Johnson',
      dobYear: '1960',
      dobMonth: '04',
      dobDay: '04',
      addressLine1: '4 John Street',
      addressLine2: 'Test Building',
      addressCity: 'Johncity',
      addressCountry: 'GB',
      addressPostcode: 'J011JO',
      email: 'John@gov.uk',
      telephoneNumber: '0161789789',
    } as ResponsiblePersonSession

    const signatoryAssociation = {
      legalEntityId: PERSON_LEGAL_ENTITY_ID,
      jobTitle: 'Responsible Person',
      type: 'signatory',
    }

    beforeEach(() => {
      legalEntityClientMock.createLegalEntity.resolves({ id: PERSON_LEGAL_ENTITY_ID, type: 'individual' })
      legalEntityClientMock.getLegalEntity.resolves({ id: ORGANISATION_LEGAL_ENTITY_ID, type: 'organization' })
      legalEntityClientMock.updateLegalEntity.resolves({ id: ORGANISATION_LEGAL_ENTITY_ID, type: 'organization' })
    })

    it('should create responsible person legal entry without any entity associations', async () => {
      await service.createResponsiblePerson(fullResponsiblePersonSession, ORGANISATION_LEGAL_ENTITY_ID)

      sinon.assert.calledOnce(legalEntityClientMock.createLegalEntity)
      expect(legalEntityClientMock.createLegalEntity.firstCall.args[0]).to.deep.equal({
        type: 'individual',
        individual: {
          name: { firstName: 'John', lastName: 'Johnson' },
          birthData: { dateOfBirth: '1960-04-04' },
          residentialAddress: {
            street: '4 John Street',
            street2: 'Test Building',
            city: 'Johncity',
            postalCode: 'J011JO',
            country: 'GB',
          },
          email: 'John@gov.uk',
          phone: { number: '+44161789789', phoneCountryCode: 'GB' },
        },
      })
    })
    it('should add the responsible person as a signatory on the organisation', async () => {
      await service.createResponsiblePerson(fullResponsiblePersonSession, ORGANISATION_LEGAL_ENTITY_ID)

      sinon.assert.calledOnceWithExactly(legalEntityClientMock.getLegalEntity, ORGANISATION_LEGAL_ENTITY_ID)
      sinon.assert.calledOnceWithExactly(legalEntityClientMock.updateLegalEntity, ORGANISATION_LEGAL_ENTITY_ID, {
        entityAssociations: [signatoryAssociation],
      })
    })
  })
})
