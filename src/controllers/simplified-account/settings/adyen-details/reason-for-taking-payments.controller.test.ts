import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_TYPE = 'live'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})

const mockResponse = sinon.stub()

const { req, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/adyen-details/reason-for-taking-payments.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount(
    GatewayAccountFixture.forSwitchingPsp(PaymentProvider.STRIPE, PaymentProvider.ADYEN, [], [], {
      type: 'live',
    }).toGatewayAccount()
  )
  .withUser(UserFixture.asServiceAdmin([serviceFixture]).toUser())
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/adyen-details/reason-for-taking-payments', () => {
  describe('get', () => {
    it('should call the response function with req, res, and the template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      mockResponse.should.have.been.calledWith(
        req,
        res,
        'simplified-account/settings/adyen-details/reason-for-taking-payments'
      )
    })

    it('should call the response method with the backLink', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      const context = mockResponse.firstCall.lastArg as { backLink: string }
      sinon.assert.match(context, {
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE
        ),
      })
    })
  })
  describe('post', () => {
    it('should redirect to the switch to adyen task list', async () => {
      await call('post')
      sinon.assert.calledOnceWithExactly(
        res.redirect,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          SERVICE_EXTERNAL_ID,
          SERVICE_TYPE
        )
      )
    })
  })
})
