import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { GatewayAccountFixture } from '@test/fixtures/gateway-account/gateway-account.fixture'
import { PaymentProvider } from '@models/constants/payment-provider'
import { UserFixture } from '@test/fixtures/user/user.fixture'
import { ServiceFixture } from '@test/fixtures/service/service.fixture'
import sinon from 'sinon'
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')
const paths = require('@root/paths')

const SERVICE_EXTERNAL_ID = 'service123abc'
const serviceFixture = new ServiceFixture({
  externalId: SERVICE_EXTERNAL_ID,
})

const mockResponse = sinon.stub()

const { req, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/switch-psp/switch-to-adyen/bank-details.controller'
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

describe('Controller: settings/switch-psp/switch-to-adyen/bank-details', () => {
  describe('get', () => {
    it('should call the response function with req, res, and the template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      mockResponse.should.have.been.calledWith(
        req,
        res,
        'simplified-account/settings/switch-psp/switch-to-adyen/bank-details'
      )
    })

    it('should call the response method with the backLink and submitLink', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      const context = mockResponse.args[0][3]
      sinon.assert.match(context, {
        backLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
          req.service.externalId,
          req.account.type
        ),
        submitLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.switchToAdyen.bankDetails,
          req.service.externalId,
          req.account.type
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
          req.service.externalId,
          req.account.type
        )
      )
    })
  })
})
