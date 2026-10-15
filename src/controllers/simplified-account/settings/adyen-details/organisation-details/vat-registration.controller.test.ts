import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { OrganisationDetailsSession, VatRegistrationBody } from './constants'
import { ServiceRequest } from '@utils/types/express'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()

const mockResponse = sinon.stub()
const markTaskAsComplete = sinon.stub().resolves()
const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/vat-registration-number'

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/vat-registration.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/adyen-setup.service': { markTaskAsComplete },
  })
  .build()

describe('Controller: settings/adyen-details/organisation-details/vat-registration', () => {
  describe('get', () => {
    describe('with no organisation details in session', () => {
      beforeEach(async () => {
        nextRequest({ session: {} })
        await call('get')
      })

      it('should redirect to the switch to adyen task list', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(/switch-to-adyen/))
      })
    })

    describe('with organisation details already in session', () => {
      beforeEach(async () => {
        nextRequest({
          session: {
            pageData: {
              organisationDetails: {
                organisationName: 'Test Organisation',
                vatRegistrationNumber: 'GB123456789',
              },
            },
          },
        })
        await call('get')
      })

      it('should call the response function with the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE_PATH)
      })

      it('should call the response method with the vatRegistrationNumber and backLink', () => {
        const context = mockResponse.firstCall.lastArg as { vatRegistrationNumber: string; backLink: string }
        sinon.assert.match(context, {
          vatRegistrationNumber: 'GB123456789',
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE,
            GATEWAY_ACCOUNT.getSwitchingCredential().externalId
          ),
        })
      })
    })
  })

  describe('post', () => {
    beforeEach(() => {
      nextRequest({
        body: { vatRegistrationNumber: 'GB123456789' },
        session: {
          pageData: {
            organisationDetails: {
              organisationName: 'Test Organisation',
              addressLine1: '1 Test Street',
              addressCity: 'swansea',
              addressPostcode: 'T3 5TT',
              addressCountry: 'GB',
              hasCompanyRegistrationNumber: 'true',
            },
          },
        },
      })
    })

    afterEach(() => {
      sinon.resetHistory()
    })

    it('should save the VAT number to the session and redirect to reason for taking payments', async () => {
      const { req } = (await call('post')) as { req: ServiceRequest<VatRegistrationBody> }

      sinon.assert.match(OrganisationDetailsSession.extract(req), {
        organisationName: 'Test Organisation',
        addressLine1: '1 Test Street',
        addressCity: 'swansea',
        addressPostcode: 'T3 5TT',
        addressCountry: 'GB',
        hasCompanyRegistrationNumber: 'true',
        vatRegistrationNumber: 'GB123456789',
      })

      sinon.assert.calledOnceWithExactly(
        res.redirect,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.organisationDetails.reasonForTakingPayments,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )
      )
    })
  })
})
