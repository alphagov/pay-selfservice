import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import Product from '@models/products/Product.class'
import { validProductResponse } from '@test/fixtures/product.fixtures'
import { ProductData } from '@models/products/dto/Product.dto'
import ProductType from '@models/products/product-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const PRODUCT_EXTERNAL_ID = 'cf3hp2'

const MOCK_PRODUCT = new Product(
  validProductResponse({
    external_id: PRODUCT_EXTERNAL_ID,
    name: 'Test Payment Link',
    description: 'Test payment link description',
    type: ProductType.ADHOC,
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    service_name_path: 'test-service',
    product_name_path: 'test-payment-link',
    price: 1000,
    reference_enabled: true,
    reference_label: 'Reference number',
  }) as ProductData
)

const MOCK_PRODUCT_NO_PRICE = new Product(
  validProductResponse({
    external_id: PRODUCT_EXTERNAL_ID,
    name: 'Test Payment Link',
    description: 'Test payment link description',
    type: ProductType.ADHOC,
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    service_name_path: 'test-service',
    product_name_path: 'test-payment-link',
    price: null,
    reference_enabled: false,
    reference_label: 'Reference number',
  }) as ProductData
)

const mockResponse = sinon.stub()
const mockProductsService = {
  getProductByExternalId: sinon.stub().resolves(MOCK_PRODUCT),
  deleteProduct: sinon.stub().resolves(),
}

const { res, next, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/delete/delete-payment-link.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withParams({ productExternalId: PRODUCT_EXTERNAL_ID })
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': mockProductsService,
  })
  .build()

describe('Controller: services/payment-links/delete', () => {
  afterEach(() => {
    mockResponse.resetHistory()
    mockProductsService.getProductByExternalId.resetHistory()
    mockProductsService.deleteProduct.resetHistory()
    mockProductsService.getProductByExternalId.resolves(MOCK_PRODUCT)
  })

  describe('get', () => {
    describe('payment link with price and reference', () => {
      beforeEach(async () => {
        await call('get')
      })

      it('should call getProductByExternalId with correct product external id', () => {
        sinon.assert.calledOnceWithExactly(mockProductsService.getProductByExternalId, PRODUCT_EXTERNAL_ID)
      })

      it('should call the response method with expected params', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/delete/index',
          {
            backLink: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.index,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            ),
            paymentLink: {
              externalId: PRODUCT_EXTERNAL_ID,
              name: 'Test Payment Link',
              description: 'Test payment link description',
              formattedPrice: '£10.00',
              referenceLabel: 'Reference number',
            },
          }
        )
      })
    })

    describe('payment link with no price and no reference', () => {
      beforeEach(async () => {
        mockProductsService.getProductByExternalId.resolves(MOCK_PRODUCT_NO_PRICE)
        await call('get')
      })

      it('should call the response method with expected params', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/delete/index',
          {
            backLink: formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.index,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            ),
            paymentLink: {
              externalId: PRODUCT_EXTERNAL_ID,
              name: 'Test Payment Link',
              description: 'Test payment link description',
              formattedPrice: 'User can choose',
              referenceLabel: 'Created by GOV.UK Pay',
            },
          }
        )
      })
    })
  })

  describe('post', () => {
    describe('when confirmDelete is "yes"', () => {
      beforeEach(async () => {
        nextRequest({
          body: { confirmDelete: 'yes' },
        })
        await call('post')
      })

      it('should call deleteProduct with correct parameters', () => {
        sinon.assert.calledOnceWithExactly(
          mockProductsService.deleteProduct,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID
        )
      })

      it('should redirect to payment links index', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.index,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })
    })

    describe('when confirmDelete is "no"', () => {
      beforeEach(async () => {
        nextRequest({
          body: { confirmDelete: 'no' },
        })
        await call('post')
      })

      it('should not call deleteProduct', () => {
        sinon.assert.notCalled(mockProductsService.deleteProduct)
      })

      it('should redirect to payment links index', () => {
        sinon.assert.calledOnceWithExactly(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.index,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })
    })

    describe('validation errors', () => {
      describe('when confirmDelete is empty', () => {
        beforeEach(async () => {
          nextRequest({
            body: { confirmDelete: '' },
          })
          await call('post')
        })

        it('should call the response method with errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/delete/index',
            sinon.match.has('errors')
          )
        })

        it('should not call deleteProduct', () => {
          sinon.assert.notCalled(mockProductsService.deleteProduct)
        })

        it('should not redirect', () => {
          sinon.assert.notCalled(res.redirect)
        })
      })

      describe('when confirmDelete is invalid value', () => {
        beforeEach(async () => {
          nextRequest({
            body: { confirmDelete: 'invalid' },
          })
          await call('post')
        })

        it('should call the response method with errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/delete/index',
            sinon.match.has('errors')
          )
        })

        it('should not call deleteProduct', () => {
          sinon.assert.notCalled(mockProductsService.deleteProduct)
        })
      })
    })

    describe('error handling', () => {
      describe('when deleteProduct fails', () => {
        beforeEach(async () => {
          const error = new Error('Delete failed')
          mockProductsService.deleteProduct.rejects(error)

          nextRequest({
            body: { confirmDelete: 'yes' },
          })
          await call('post')
        })

        it('should call next with the error', () => {
          sinon.assert.calledOnceWithMatch(next, sinon.match.instanceOf(Error))
        })

        it('should not redirect', () => {
          sinon.assert.notCalled(res.redirect)
        })
      })

      describe('when getProductByExternalId fails', () => {
        it('should propagate the error', async () => {
          const error = new Error('Product not found')
          mockProductsService.getProductByExternalId.rejects(error)

          let thrownError
          try {
            await call('get')
          } catch (err) {
            thrownError = err
          }

          sinon.assert.calledOnce(mockProductsService.getProductByExternalId)
          sinon.assert.match(thrownError, sinon.match.instanceOf(Error))
        })
      })
    })
  })
})
