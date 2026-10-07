import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { utils } from '@govuk-pay/pay-js-commons'

const { countries } = utils
const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})
const GATEWAY_ACCOUNT = GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
  type: 'live',
}).toGatewayAccount()
const TEMPLATE_PATH = 'simplified-account/settings/adyen-details/organisation-details'
const mockResponse = sinon.stub()

const { res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/organisation-details/organisation-details.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(GATEWAY_ACCOUNT)
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/organisation-details/organisation-details', () => {
  describe('get', () => {
    describe('with no session data', () => {
      beforeEach(async () => {
        nextRequest({ session: {} })
        await call('get')
      })

      it('should call the response function with the template path', () => {
        mockResponse.should.have.been.calledOnce
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, TEMPLATE_PATH)
      })

      it('should call the response method with blank organisation details, hasCompanyRegistrationNumber, countries and backLink', () => {
        mockResponse.should.have.been.calledOnce
        const context = mockResponse.firstCall.lastArg as {
          organisationDetails: object
          hasCompanyRegistrationNumber: string
          countries: unknown[]
          backLink: string
        }
        sinon.assert.match(context, {
          organisationDetails: {
            organisationName: '',
            addressLine1: '',
            addressLine2: '',
            addressCity: '',
            addressPostcode: '',
            addressCountry: 'GB',
          },
          hasCompanyRegistrationNumber: '',
          countries: countries.govukFrontendFormatted('GB'),
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
            SERVICE_EXTERNAL_ID,
            SERVICE_TYPE
          ),
        })
      })
    })

    describe('with existing session data', () => {
      beforeEach(async () => {
        nextRequest({
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
        await call('get')
      })

      it('should call the response method with the session values', () => {
        const context = mockResponse.firstCall.lastArg as {
          organisationDetails: { organisationName: string }
          hasCompanyRegistrationNumber: string
        }
        sinon.assert.match(context.organisationDetails, {
          organisationName: 'Test Organisation',
          addressLine1: '1 Test Street',
          addressCity: 'swansea',
          addressPostcode: 'T3 5TT',
          addressCountry: 'GB',
        })
        sinon.assert.match(context.hasCompanyRegistrationNumber, 'true')
      })
    })
  })

  describe('post', () => {
    beforeEach(() => {
      nextRequest({
        body: {
          organisationName: 'Test Organisation',
          addressLine1: '1 Test Street',
          addressLine2: '',
          addressCity: 'swansea',
          addressPostcode: 'T3 5TT',
          addressCountry: 'GB',
          hasCompanyRegistrationNumber: 'true',
        },
        session: {},
      })
    })

    it('should redirect to the company registration number page', async () => {
      await call('post')
      sinon.assert.calledOnceWithExactly(
        res.redirect,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.adyenDetails.organisationDetails.companyRegistration,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE,
          GATEWAY_ACCOUNT.getSwitchingCredential().externalId
        )
      )
    })
  })
})
