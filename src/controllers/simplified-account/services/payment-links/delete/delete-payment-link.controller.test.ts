import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'

const mockResponse = sinon.spy()

const { call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/delete/delete-payment-link.controller',
)
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('controller: services/payment-links/delete', () => {
  describe('get', () => {
    beforeEach(async () => {
      nextRequest({
        // modify the request
      })
      await call('get')
    })

    it('should call the response method', () => {
      sinon.assert.calledOnce(mockResponse)
    })
  })
})
