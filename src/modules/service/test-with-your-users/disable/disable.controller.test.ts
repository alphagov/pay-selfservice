import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import sinon from 'sinon'
import { Message } from '@utils/types/express/Message'

const GATEWAY_ACCOUNT_ID = 100
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'ga-123-external-id-abc'
const SERVICE_EXTERNAL_ID = 'service-123-external-id-abc'
const PRODUCT_EXTERNAL_ID = 'product-123-external-id-abc'

const disableProductStub = sinon.stub()

const { call, res, req } = new ControllerTestBuilder('@modules/service/test-with-your-users/disable/disable.controller')
  .withController('DisableController')
  .withStubs({
    '@services/products.service': {
      disableProduct: disableProductStub,
    },
  })
  .withParams({
    productExternalId: PRODUCT_EXTERNAL_ID,
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

describe('test-with-your-users/disable controller tests', () => {
  describe('get', () => {
    describe('when disableProduct succeeds', () => {
      beforeEach(() => {
        disableProductStub.resolves()
      })

      it('should call disableProduct with the product external ID', async () => {
        await call('get')

        disableProductStub.should.have.been.calledOnce
        disableProductStub.should.have.been.calledWith(GATEWAY_ACCOUNT_ID, PRODUCT_EXTERNAL_ID)
      })

      it('should redirect to the links page', async () => {
        await call('get')

        res.redirect.should.have.been.calledWith(
          `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/test-with-your-users/links`
        )
      })

      it('should set a success message on the session', async () => {
        await call('get')

        req.flash.should.have.been.calledOnce
        req.flash.should.have.been.calledWith('messages', Message.Success('Prototype link deleted'))
      })
    })

    describe('when disableProduct fails', () => {
      beforeEach(() => {
        disableProductStub.rejects(new Error('something went wrong'))
      })

      it('should redirect to the links page', async () => {
        await call('get')

        res.redirect.should.have.been.calledWith(
          `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/test-with-your-users/links`
        )
      })

      it('should set an error message on the session', async () => {
        await call('get')

        req.flash.should.have.been.calledOnce
        req.flash.should.have.been.calledWith(
          'messages',
          Message.GenericError(
            'Something went wrong when deleting the prototype link. Please try again or contact support.'
          )
        )
      })
    })
  })
})
