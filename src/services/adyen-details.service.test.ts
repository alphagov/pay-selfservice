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
    createBusinessLine: sinon.stub(),
    getTermsOfService: sinon.stub(),
    acceptTermsOfService: sinon.stub(),
  }

  const balancePlatformClientMock = {
    createAccountHolder: sinon.stub(),
    createBalanceAccount: sinon.stub(),
  }

  const managementClientMock = {
    createStore: sinon.stub(),
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
      '@services/clients/adyen/adyen-balance-platform.client': balancePlatformClientMock,
      '@services/clients/adyen/adyen-management.client': managementClientMock,
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

    const SERVICE_NAME = 'Test Service'
    const BALANCE_PLATFORM_ID = 'BP123'

    const legalEntity = { id: 'LE123', type: ORGANISATION_TYPE }
    const accountHolder = { id: 'AH123', legalEntityId: 'LE123' }
    const balanceAccount = { id: 'BA123', accountHolderId: 'AH123' }

    beforeEach(() => {
      process.env.ADYEN_BALANCE_PLATFORM_ID = BALANCE_PLATFORM_ID
      legalEntityClientMock.createLegalEntity.resolves(legalEntity)
      balancePlatformClientMock.createAccountHolder.resolves(accountHolder)
      balancePlatformClientMock.createBalanceAccount.resolves(balanceAccount)
      connectorClientMock.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType.resolves({})
      legalEntityClientMock.createBusinessLine.resolves({ id: 'BL123' })
    })

    afterEach(() => {
      delete process.env.ADYEN_BALANCE_PLATFORM_ID
    })

    it('should create Adyen legal entity for an organisation', async () => {
      const result = await service.createOrganisation(
        fullOrganisationSession,
        'general-local',
        SERVICE_NAME,
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

      expect(result.legalEntity).to.equal(legalEntity)
    })

    it('should create Adyen account holder for the organisation legal entity', async () => {
      const result = await service.createOrganisation(
        fullOrganisationSession,
        'general-local',
        SERVICE_NAME,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )

      sinon.assert.calledOnceWithExactly(balancePlatformClientMock.createAccountHolder, {
        legalEntityId: 'LE123',
        balancePlatform: BALANCE_PLATFORM_ID,
        description: SERVICE_NAME,
      })
      sinon.assert.callOrder(legalEntityClientMock.createLegalEntity, balancePlatformClientMock.createAccountHolder)
      expect(result.accountHolder).to.equal(accountHolder)
    })

    it('should create Adyen balance account for the organisation account holder', async () => {
      const result = await service.createOrganisation(
        fullOrganisationSession,
        'general-local',
        SERVICE_NAME,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )

      sinon.assert.calledOnceWithExactly(balancePlatformClientMock.createBalanceAccount, {
        accountHolderId: 'AH123',
        defaultCurrencyCode: 'GBP',
        description: SERVICE_NAME,
      })
      sinon.assert.callOrder(
        balancePlatformClientMock.createAccountHolder,
        balancePlatformClientMock.createBalanceAccount
      )
      expect(result.balanceAccount).to.equal(balanceAccount)
    })

    it('should not create balance account when account holder creation fails', async () => {
      balancePlatformClientMock.createAccountHolder.rejects(new Error('Adyen error'))

      await expect(
        service.createOrganisation(
          fullOrganisationSession,
          'general-local',
          SERVICE_NAME,
          'service_id',
          'live',
          'credential_id',
          'user_id'
        )
      ).to.be.rejectedWith('Adyen error')

      sinon.assert.notCalled(balancePlatformClientMock.createBalanceAccount)
    })

    it('should not create account holder when ADYEN_BALANCE_PLATFORM_ID is NOT set', async () => {
      delete process.env.ADYEN_BALANCE_PLATFORM_ID

      await expect(
        service.createOrganisation(
          fullOrganisationSession,
          'general-local',
          SERVICE_NAME,
          'service_id',
          'live',
          'credential_id',
          'user_id'
        )
      ).to.be.rejectedWith('ADYEN_BALANCE_PLATFORM_ID is not set')
      sinon.assert.notCalled(balancePlatformClientMock.createAccountHolder)
    })

    it('should persist the legal entity id', async () => {
      await service.createOrganisation(
        fullOrganisationSession,
        'general-local',
        SERVICE_NAME,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )

      sinon.assert.calledOnceWithExactly(
        connectorClientMock.gatewayAccounts.patchCredentialsByServiceExternalIdAndAccountType,
        'service_id',
        'live',
        'credential_id',
        new GatewayAccountCredentialUpdateRequest('user_id')
          .replace()
          .credentials()
          .legalEntityId('LE123')
          .replace()
          .credentials()
          .balanceAccountId('BA123')
          .replace()
          .credentials()
          .accountHolderId('AH123')
      )
    })

    it('should create Adyen business line for the organisation legal entity', async () => {
      await service.createOrganisation(
        fullOrganisationSession,
        'general-local',
        SERVICE_NAME,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )

      sinon.assert.calledOnceWithExactly(legalEntityClientMock.createBusinessLine, {
        service: 'paymentProcessing',
        industryCode: '921',
        legalEntityId: 'LE123',
        salesChannels: ['eCommerce'],
      })
      sinon.assert.callOrder(
        legalEntityClientMock.createLegalEntity,
        legalEntityClientMock.createBusinessLine,
        balancePlatformClientMock.createAccountHolder
      )
    })

    it('should map police-safety to industry code 92219', async () => {
      await service.createOrganisation(
        fullOrganisationSession,
        'police-safety',
        SERVICE_NAME,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )
      expect(legalEntityClientMock.createBusinessLine.firstCall.args[0].industryCode).to.equal('92219')
    })

    it('should map everything-else to industry code 92B', async () => {
      await service.createOrganisation(
        fullOrganisationSession,
        'everything-else',
        SERVICE_NAME,
        'service_id',
        'live',
        'credential_id',
        'user_id'
      )
      expect(legalEntityClientMock.createBusinessLine.firstCall.args[0].industryCode).to.equal('92B')
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
      legalEntityClientMock.getTermsOfService.resolves({
        termsOfServiceDocumentId: 'terms-of-service-document-id',
      })
      legalEntityClientMock.acceptTermsOfService.resolves({})
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

    it('should generate the terms of service', async () => {
      await service.createResponsiblePerson(fullResponsiblePersonSession, ORGANISATION_LEGAL_ENTITY_ID)

      sinon.assert.calledOnceWithExactly(legalEntityClientMock.getTermsOfService, ORGANISATION_LEGAL_ENTITY_ID, {
        language: 'en',
        type: 'adyenForPlatformsAdvanced',
        termsOfServiceDocumentFormat: 'TXT',
      })
    })

    it('should sign the terms of service', async () => {
      await service.createResponsiblePerson(fullResponsiblePersonSession, ORGANISATION_LEGAL_ENTITY_ID)

      sinon.assert.calledOnceWithExactly(
        legalEntityClientMock.acceptTermsOfService,
        ORGANISATION_LEGAL_ENTITY_ID,
        'terms-of-service-document-id',
        {
          acceptedBy: 'LE_PERSON_456',
        }
      )
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

  describe('createStore', () => {
    const organisationDetails = {
      organisationName: 'Test Org Ltd',
      addressLine1: '1 Test St',
      addressCity: 'London',
      addressPostcode: 'N1 1NN',
      addressCountry: 'GB',
    } as OrganisationDetailsSession

    const storeParams = {
      businessLineId: 'BL123',
      balanceAccountId: 'BA123',
      serviceName: 'Test Service',
      statementDescriptor: 'TEST SERVICE',
      telephoneNumber: '01234 567890',
      organisationDetails,
    }

    beforeEach(() => {
      process.env.ADYEN_LIVE_MERCHANT_ACCOUNT_ID = 'MERCHANT123'
      process.env.ADYEN_LIVE_SPLIT_CONFIGURATION_ID = 'SC123'
    })

    afterEach(() => {
      delete process.env.ADYEN_LIVE_MERCHANT_ACCOUNT_ID
      delete process.env.ADYEN_LIVE_SPLIT_CONFIGURATION_ID
    })

    it('should create Adyen store linked to the given business line with a split configuration', async () => {
      const store = { id: 'ST123', businessLineIds: ['BL123'] }
      managementClientMock.createStore.resolves(store)

      const result = await service.createStore(storeParams)

      sinon.assert.calledOnceWithExactly(managementClientMock.createStore, {
        merchantId: 'MERCHANT123',
        description: 'Test Service',
        shopperStatement: 'TEST SERVICE',
        phoneNumber: '+441234567890',
        address: {
          line1: '1 Test St',
          line2: undefined,
          city: 'London',
          postalCode: 'N1 1NN',
          country: 'GB',
        },
        businessLineIds: ['BL123'],
        splitConfiguration: {
          balanceAccountId: 'BA123',
          splitConfigurationId: 'SC123',
        },
      })
      expect(result).to.equal(store)
    })

    it('should not create store when ADYEN_LIVE_MERCHANT_ACCOUNT_ID is NOT set', async () => {
      delete process.env.ADYEN_LIVE_MERCHANT_ACCOUNT_ID

      await expect(service.createStore(storeParams)).to.be.rejectedWith('ADYEN_LIVE_MERCHANT_ACCOUNT_ID is not set')
      sinon.assert.notCalled(managementClientMock.createStore)
    })

    it('should not create store when ADYEN_LIVE_SPLIT_CONFIGURATION_ID is NOT set', async () => {
      delete process.env.ADYEN_LIVE_SPLIT_CONFIGURATION_ID

      await expect(service.createStore(storeParams)).to.be.rejectedWith('ADYEN_LIVE_SPLIT_CONFIGURATION_ID is not set')
      sinon.assert.notCalled(managementClientMock.createStore)
    })
  })

  describe('createBalanceAccount', () => {
    const ACCOUNT_HOLDER_ID = 'ABC123'
    const SERVICE_NAME = 'Test Service'

    it('should create Adyen balance account for the given account holder', async () => {
      const balanceAccount = { id: 'BA123', accountHolderId: ACCOUNT_HOLDER_ID }
      balancePlatformClientMock.createBalanceAccount.resolves(balanceAccount)

      const result = await service.createBalanceAccount(ACCOUNT_HOLDER_ID, SERVICE_NAME)

      sinon.assert.calledOnceWithExactly(balancePlatformClientMock.createBalanceAccount, {
        accountHolderId: ACCOUNT_HOLDER_ID,
        defaultCurrencyCode: 'GBP',
        description: SERVICE_NAME,
      })
      expect(result).to.equal(balanceAccount)
    })
  })
})
