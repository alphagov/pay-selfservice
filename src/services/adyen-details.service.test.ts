import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import type { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { Types } from '@adyen/api-library'
import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'

type LegalEntity = Types.legalEntityManagement.LegalEntity
type CreateOrganisation = (session: OrganisationDetailsSession) => Promise<LegalEntity>
type CreateResonsiblePerson = (session: ResponsiblePersonSession, id: string) => Promise<LegalEntity>

interface AdyenDetailsService {
  createOrganisation: CreateOrganisation
  createResponsiblePerson: CreateResonsiblePerson
}

describe('Adyen details service', () => {
  let createLegalEntityStub: sinon.SinonStub
  let getLegalEntityStub: sinon.SinonStub
  let updateLegalEntityStub: sinon.SinonStub
  let createOrganisation: CreateOrganisation
  let createResponsiblePerson: CreateResonsiblePerson

  const ORGANISATION_TYPE = 'organization'
  const ORGANISATION_LEGAL_ENTITY_ID = 'LE_ORG_123'
  const PERSON_LEGAL_ENTITY_ID = 'LE_PERSON_456'

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
    type: 'signatory',
  }

  beforeEach(() => {
    createLegalEntityStub = sinon.stub()
    getLegalEntityStub = sinon.stub()
    updateLegalEntityStub = sinon.stub()

    class ConnectorClientStub {
      gatewayAccounts = {
        patchCredentialsByServiceExternalIdAndAccountType: sinon.stub().resolves({}),
      }
    }

    const adyenDetailsService = proxyquire('./adyen-details.service', {
      '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class': {
        GatewayAccountCredentialUpdateRequest: class {},
      },
      '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
      '@services/clients/adyen/adyen-legal-entity-management.client': {
        createLegalEntity: createLegalEntityStub,
        getLegalEntity: getLegalEntityStub,
        updateLegalEntity: updateLegalEntityStub,
      },
    }) as AdyenDetailsService

    createOrganisation = adyenDetailsService.createOrganisation
    createResponsiblePerson = adyenDetailsService.createResponsiblePerson
  })

  afterEach(() => {
    createLegalEntityStub.resetHistory()
    getLegalEntityStub.resetHistory()
    updateLegalEntityStub.resetHistory()
  })

  describe('createLegalEntity', () => {
    it('should create Adyen legal entity for an organisation', async () => {
      const legalEntity = { id: 'LE123', type: ORGANISATION_TYPE }
      createLegalEntityStub.resolves(legalEntity)

      const result = await createOrganisation(fullOrganisationSession)

      sinon.assert.calledOnce(createLegalEntityStub)

      expect(createLegalEntityStub.firstCall.args[0]).to.deep.equal({
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
    beforeEach(() => {
      createLegalEntityStub.resolves({ id: PERSON_LEGAL_ENTITY_ID, type: 'individual' })
      getLegalEntityStub.resolves({ id: ORGANISATION_LEGAL_ENTITY_ID, type: 'organization' })
      updateLegalEntityStub.resolves({ id: ORGANISATION_LEGAL_ENTITY_ID, type: 'organization' })
    })

    it('should create responsible person legal entry without any entity associations', async () => {
      await createResponsiblePerson(fullResponsiblePersonSession, ORGANISATION_LEGAL_ENTITY_ID)

      sinon.assert.calledOnce(createLegalEntityStub)
      expect(createLegalEntityStub.firstCall.args[0]).to.deep.equal({
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
          phone: { number: '0161789789', phoneCountryCode: 'GB' },
        },
      })
    })
    it('should add the responsible person as a signatory on the organisation', async () => {
      await createResponsiblePerson(fullResponsiblePersonSession, ORGANISATION_LEGAL_ENTITY_ID)

      sinon.assert.calledOnceWithExactly(getLegalEntityStub, ORGANISATION_LEGAL_ENTITY_ID)
      sinon.assert.calledOnceWithExactly(updateLegalEntityStub, ORGANISATION_LEGAL_ENTITY_ID, {
        entityAssociations: [signatoryAssociation],
      })
    })
  })
})
