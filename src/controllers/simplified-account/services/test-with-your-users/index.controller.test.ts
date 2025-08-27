import ControllerTestBuilder from "@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class";
import GatewayAccountType from "@models/gateway-account/gateway-account-type";
import sinon from "sinon";
import formatServiceAndAccountPathsFor from "@utils/simplified-account/format/format-service-and-account-paths-for";
import paths from "@root/paths";

const mockResponse = sinon.stub()

const GATEWAY_ACCOUNT_ID = 100
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'


const { call, res, req } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/test-with-your-users/index.controller'
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
  .build()

describe('test-with-your-users/index controller tests', () => {
  describe('get', () => {
    it('should call the response method with req, res and the template path', async () => {
      await call('get')

      mockResponse.should.have.been.calledOnce
      mockResponse.should.have.been.calledWith(req, res, 'simplified-account/services/test-with-your-users/index')
    })

    it('should call the response method with the context object', async () => {
      await call('get')

      mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
        messages: [],
        productsTab: false,
        createLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.create, SERVICE_EXTERNAL_ID, GatewayAccountType.TEST),
        prototypesLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.testWithYourUsers.links,  SERVICE_EXTERNAL_ID, GatewayAccountType.TEST),
        backLink: formatServiceAndAccountPathsFor(paths.simplifiedAccount.dashboard.index, SERVICE_EXTERNAL_ID, GatewayAccountType.TEST)
      })
    })
  })
})
