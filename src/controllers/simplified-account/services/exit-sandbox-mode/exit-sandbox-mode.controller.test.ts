import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import sinon from 'sinon'
import { NotFoundError } from '@root/errors'
import { Message } from '@utils/types/express/Message'

const mockResponse = sinon.stub()

const GATEWAY_ACCOUNT_ID = 100
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'

const { call, req, res, next, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/exit-sandbox-mode/exit-sandbox-mode.controller'
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

describe('exit sandbox mode controller tests', () => {
  describe('get', () => {
    describe('for a live account', () => {
      beforeEach(() => {
        nextRequest({
          account: {
            type: GatewayAccountType.LIVE,
          },
          serviceView: {
            statusTag: 'LIVE',
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
                `Unable to exit sandbox mode for service [${SERVICE_EXTERNAL_ID}] - not in sandbox mode`
              )
            )
        )
      })
    })

    describe('for a test account', () => {
      beforeEach(() => {
        nextRequest({
          account: {
            type: GatewayAccountType.TEST,
          },
          serviceView: {
            statusTag: 'SANDBOX_MODE',
          },
        })
      })

      it('should call redirect with the dashboard path', async () => {
        await call('get')
        res.redirect.should.have.been.calledOnce
        res.redirect.should.have.been.calledWith(`/service/${SERVICE_EXTERNAL_ID}/account/live/dashboard`)
      })

      it('call flash with a success message', async () => {
        await call('get')
        req.flash.should.have.been.calledOnce
        req.flash.should.have.been.calledWith(
          'messages',
          Message.Success('You have left sandbox mode. Any changes you make now will affect your live service.')
        )
      })
    })
  })
})
