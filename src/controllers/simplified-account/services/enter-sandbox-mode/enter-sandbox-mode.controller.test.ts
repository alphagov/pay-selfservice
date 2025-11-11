import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import sinon from 'sinon'
import { NotFoundError } from '@root/errors'

const mockResponse = sinon.stub()

const GATEWAY_ACCOUNT_ID = 100
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'

const { call, req, res, next, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/enter-sandbox-mode/enter-sandbox-mode.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    externalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
    type: GatewayAccountType.LIVE,
  })
  .withService({
    name: 'Test Service',
    externalId: SERVICE_EXTERNAL_ID,
  })
  .build()

describe('enter sandbox mode controller tests', () => {
  describe('get', () => {
    describe('for a test account', () => {
      beforeEach(() => {
        nextRequest({
          account: {
            type: GatewayAccountType.TEST,
          },
        })
      })

      it('should throw a not found error', async () => {
        await call('get')
        mockResponse.should.not.have.been.called
        next.should.have.been.calledOnce
        next.should.have.been.calledWith(
          sinon.match
            .instanceOf(NotFoundError)
            .and(
              sinon.match.has(
                'message',
                `Unable to enter sandbox mode for service [${SERVICE_EXTERNAL_ID}] - already in sandbox mode`
              )
            )
        )
      })
    })

    describe('for a live account', () => {
      beforeEach(() => {
        nextRequest({
          account: {
            type: GatewayAccountType.LIVE,
          },
        })
      })

      it('should call the response method', async () => {
        await call('get')
        mockResponse.should.have.been.calledOnce
      })

      it('should pass the req, res and template to the response method', async () => {
        await call('get')
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/services/enter-sandbox-mode/index')
      })

      it('should pass the test dashboard URL to the response method', async () => {
        await call('get')
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          sandboxModeUrl: `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/dashboard`,
        })
      })
    })
  })
})
