import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { expect } from 'chai'
import type { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
import { ResponsiblePersonSession } from '@controllers/simplified-account/settings/adyen-details/responsible-person/constants'
import { ServiceDirectorSession } from '@controllers/simplified-account/settings/adyen-details/service-director/constants'
import { GatewayAccountCredentialUpdateRequest } from '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class'

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
      '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
      '@services/clients/adyen/adyen-legal-entity-management.client': legalEntityClientMock,
    })
  })

  describe('createOrganisation', () => {
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
      connectorClientMock.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType.resolves({})

      const result = await service.createOrganisation(
        fullOrganisationSession,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )

      sinon.assert.calledOnceWithExactly(legalEntityClientMock.createLegalEntity, {
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

      sinon.assert.calledOnceWithExactly(
        connectorClientMock.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType,
        'service_id',
        'live',
        'credential_id',
        new GatewayAccountCredentialUpdateRequest('user_id').replace().credentials().legalEntityId('LE123')
      )

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

  describe('createServiceDirector', () => {
    const serviceDirectorSession = {
      firstName: 'John',
      lastName: 'Johnson',
      dobYear: '1960',
      dobMonth: '4',
      dobDay: '4',
      email: 'John@gov.uk',
      addressLine1: '4 John Street',
      addressLine2: 'Test Building',
      addressCity: 'Johncity',
      addressPostcode: 'J011JO',
    } as ServiceDirectorSession

    context('when the organisation legalEntityId is found', () => {
      const ORGANISATION_LEGAL_ENTITY_ID = 'LE_ORG_123'
      const PERSON_LEGAL_ENTITY_ID = 'LE_PERSON_456'

      beforeEach(() => {
        legalEntityClientMock.getLegalEntity.resolves({
          id: ORGANISATION_LEGAL_ENTITY_ID,
          type: 'organization',
          entityAssociations: [
            { legalEntityId: 'OTHER_DIRECTOR_LEGAL_ENTITY_ID', type: 'director' },
            { legalEntityId: 'OTHER_SIGNATORY_LEGAL_ENTITY_ID', type: 'signatory', jobTitle: 'responsible person' },
          ],
        })
        legalEntityClientMock.createLegalEntity.resolves({ id: PERSON_LEGAL_ENTITY_ID, type: 'individual' })
        legalEntityClientMock.updateLegalEntity.resolves({ id: ORGANISATION_LEGAL_ENTITY_ID })
      })

      it('should create serviceDirector legal entry and add the entity association', async () => {
        await service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)

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
          },
        })
      })

      it('should add the director and keep the existing associations', async () => {
        await service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)

        expect(legalEntityClientMock.updateLegalEntity.firstCall.args[0]).to.equal(ORGANISATION_LEGAL_ENTITY_ID)
        expect(legalEntityClientMock.updateLegalEntity.firstCall.args[1]).to.deep.equal({
          entityAssociations: [
            { legalEntityId: 'OTHER_DIRECTOR_LEGAL_ENTITY_ID', type: 'director' },
            { legalEntityId: 'OTHER_SIGNATORY_LEGAL_ENTITY_ID', type: 'signatory', jobTitle: 'responsible person' },
            {
              legalEntityId: PERSON_LEGAL_ENTITY_ID,
              type: 'director',
            },
          ],
        })
      })

      it('should return the result of creating the serviceDirector', async () => {
        const result = await service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)
        expect(result).to.deep.equal({
          id: PERSON_LEGAL_ENTITY_ID,
          type: 'individual',
        })
      })

      context('when the organisation is not found', () => {
        beforeEach(() => {
          legalEntityClientMock.getLegalEntity.rejects(
            new Error('Organisation legal entity with ID LE_ORG_123 not found')
          )
        })

        it('should throw an error', async () => {
          await expect(
            service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)
          ).to.be.rejectedWith('Organisation legal entity with ID LE_ORG_123 not found')
        })

        it('should not create a serviceDirector', async () => {
          await expect(service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)).to.be
            .rejected
          sinon.assert.notCalled(legalEntityClientMock.createLegalEntity)
        })
      })

      context('when the serviceDirector cannot be created', () => {
        beforeEach(() => {
          legalEntityClientMock.createLegalEntity.rejects(new Error('Service director creation failed'))
        })

        it('should throw an error and not change the organisation legalentity', async () => {
          await expect(
            service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)
          ).to.be.rejectedWith('Service director legal entity creation failed: Service director creation failed')

          sinon.assert.notCalled(legalEntityClientMock.updateLegalEntity)
        })
      })

      context('when the serviceDirector cannot be linked to the organisation', () => {
        beforeEach(() => {
          legalEntityClientMock.createLegalEntity.resolves({ id: PERSON_LEGAL_ENTITY_ID, type: 'individual' })
          legalEntityClientMock.updateLegalEntity.rejects(new Error('adyen error linking'))
        })

        it('should throw an error with the serviceDirector ID included for debugging', async () => {
          await expect(
            service.createServiceDirector(serviceDirectorSession, ORGANISATION_LEGAL_ENTITY_ID)
          ).to.be.rejectedWith(
            "Couldn't link director (LE_PERSON_456) to organisation (LE_ORG_123): adyen error linking"
          )
        })
      })
    })
  })
})
