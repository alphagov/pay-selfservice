import sinon from 'sinon'

import ControllerTestBuilder from "@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class";
import GatewayAccountType from "@models/gateway-account/gateway-account-type";
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import paths from "@root/paths";

const mockResponse = sinon.stub()

const GATEWAY_ACCOUNT_ID = '100'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'

const { call, res, req } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/test-with-your-users/confirm.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.TEST,
  })
  .withService({
    name: 'Test Service',
    externalId: SERVICE_EXTERNAL_ID,
  })
  .withSession({
    pageData: {
      testWithYourUsers: {
        prototypeLink: 'https://pay.test/test-prototype-link'
      }
    }
  })
  .build()

describe('test-with-your-users/confirm controller tests', () => {
  describe('get', () => {
    it('should call the response method', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
    })

    it('should call the response method with the request, response, and template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/services/test-with-your-users/confirm')
    })

    it('should call the response method with the context object', async () => {
      await call('get')

      mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        prototypeLink: 'https://pay.test/test-prototype-link',
        prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  SERVICE_EXTERNAL_ID, GatewayAccountType.TEST),
      })
    })
  });
})
