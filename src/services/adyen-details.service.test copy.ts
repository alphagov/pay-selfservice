// import sinon from 'sinon'
// import proxyquire from 'proxyquire'
// import { expect } from 'chai'
// import type { OrganisationDetailsSession } from '@controllers/simplified-account/settings/adyen-details/organisation-details/constants'
// import { Types } from '@adyen/api-library'
// import { createTransferInstrument } from './clients/adyen/adyen-legal-entity-management.client'
// import { TransferInstrument } from '@adyen/api-library/lib/src/typings/legalEntityManagement/transferInstrument'
// import { createBankDetails } from './adyen-details.service'
// import { CreateBankDetailsBody } from '@controllers/simplified-account/settings/adyen-details/bank-details.controller'
// import { any } from 'joi'
// import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
// import { PaymentProvider } from '@models/constants/payment-provider'

// type LegalEntity = Types.legalEntityManagement.LegalEntity
// type CreateOrganisation = (session: OrganisationDetailsSession) => Promise<LegalEntity>
// type CreateBankDetails = (details: CreateBankDetailsBody, serviceExternalId: string, accountType: string, switchingCredentialId: string) => Promise<TransferInstrument>

// interface AdyenDetailsService {
//   createOrganisation: CreateOrganisation
//   createBankDetails: CreateBankDetails
// }

// describe('Adyen details service', () => {
//   let createLegalEntityStub: sinon.SinonStub
//   let createOrganisation: CreateOrganisation
//   let createBankDetails: CreateBankDetails
//   let createTransferInstrumentStub: sinon.SinonStub

//   const ORGANISATION_TYPE = 'organization'

//   const fullSession = {
//     organisationName: 'Test Org Ltd',
//     addressLine1: '1 Test Street',
//     addressLine2: 'Test Building',
//     addressCity: 'London',
//     addressPostcode: 'SW1A 1AA',
//     addressCountry: 'GB',
//     companyRegistrationNumber: '12345678',
//     vatRegistrationNumber: 'GB123456789',
//   } as OrganisationDetailsSession

//   const bankDetails = {
//     sortCode: '090102',
//     accountNumber: '00000123',
//   }

//   beforeEach(() => {
//     createLegalEntityStub = sinon.stub()
//     createTransferInstrumentStub = sinon.stub()

//     const gatewayAccountFixture = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
//       type: 'live',
//     }).toGatewayAccount()

//     class ConnectorClientStub {
//       gatewayAccounts = {
//         patchCredentialsByServiceExternalIdAndAccountType: sinon.stub().resolves({}),
//         getByServiceExternalIdAndAccountType: sinon.stub().resolves(gatewayAccountFixture)
//       }
//     }

//     const adyenDetailsService = proxyquire('./adyen-details.service', {
//       '@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class': {
//         GatewayAccountCredentialUpdateRequest: class { },
//       },
//       '@services/clients/pay/ConnectorClient.class': ConnectorClientStub,
//       '@services/clients/adyen/adyen-legal-entity-management.client': {
//         createLegalEntity: createLegalEntityStub,
//         createTransferInstrument: createTransferInstrumentStub
//       },
//     }) as AdyenDetailsService

//     createOrganisation = adyenDetailsService.createOrganisation
//     createBankDetails = adyenDetailsService.createBankDetails
//   })

//   afterEach(() => {
//     createLegalEntityStub.resetHistory()
//   })

//   it('should create Adyen legal entity', async () => {
//     const legalEntity = { id: 'LE123', type: ORGANISATION_TYPE }
//     createLegalEntityStub.resolves(legalEntity)

//     const result = await createOrganisation(fullSession)

//     sinon.assert.calledOnce(createLegalEntityStub)

//     expect(createLegalEntityStub.firstCall.args[0]).to.deep.equal({
//       type: ORGANISATION_TYPE,
//       organization: {
//         legalName: 'Test Org Ltd',
//         registeredAddress: {
//           street: '1 Test Street',
//           street2: 'Test Building',
//           city: 'London',
//           postalCode: 'SW1A 1AA',
//           country: 'GB',
//         },
//         registrationNumber: '12345678',
//         vatNumber: 'GB123456789',
//       },
//     })

//     expect(result).to.equal(legalEntity)
//   })

//   it('should create Adyen transfer instrument', async () => {
//     const transferInstrument = { id: 'LE123', type: ORGANISATION_TYPE }
//     createTransferInstrumentStub.resolves(transferInstrument)

//     const result = await createBankDetails(bankDetails, '123', 'test', '456')

//     sinon.assert.calledOnce(createTransferInstrumentStub)

//     expect(createTransferInstrumentStub.firstCall.args[0]).to.deep.equal({
//     })

//     expect(result).to.equal(transferInstrument)
//   })
// })
