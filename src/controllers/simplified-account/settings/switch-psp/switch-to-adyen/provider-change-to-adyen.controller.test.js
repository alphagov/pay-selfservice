const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const paths = require('@root/paths')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const { GatewayAccountType } = require('@models/gateway-account/gateway-account-type')
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')

const mockResponse = sinon.stub()

const ACCOUNT_TYPE = GatewayAccountType.LIVE
const ACCOUNT_EXTERNAL_ID = 'account123abc'
const SERVICE_EXTERNAL_ID = 'service123abc'

const { req, res, next, nextRequest, nextResponse, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/switch-psp/switch-to-adyen/provider-change-to-adyen.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    externalId: ACCOUNT_EXTERNAL_ID,
    type: ACCOUNT_TYPE,
    paymentProvider: STRIPE,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-adyen/provider-change-to-adyen', () => {
  it('should call the response method', async () => {
    await call('get')
    sinon.assert.calledOnce(mockResponse)
  })

  it('should pass req, res and template path to the response method', async () => {
    await call('get')
    sinon.assert.calledWith(
      mockResponse,
      req,
      res,
      'simplified-account/settings/switch-psp/switch-to-adyen/provider-change'
    )
  })

  it('should pass the context data to the response method', async () => {
    await call('get')
    const context = mockResponse.args[0][3]
    sinon.assert.match(context, {
      feesPath: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.adyenFees,
        req.service.externalId,
        req.account.type
      ),
    })
  })
})
