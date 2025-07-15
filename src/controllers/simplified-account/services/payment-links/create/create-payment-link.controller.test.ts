import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import Product from '@models/products/Product.class'
import ProductType from '@models/products/product-type'
import { expect } from 'chai'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117

const mockResponse = sinon.spy()
const mockProduct = new Product({
  external_id: 'test-product-id',
  gateway_account_id: GATEWAY_ACCOUNT_ID,
  name: 'Test Payment Link',
  type: ProductType.ADHOC,
  price: 1000,
  status: 'ACTIVE',
  description: 'Test description',
  reference_enabled: true,
  reference_label: 'Reference',
  reference_hint: '',
  amount_hint: '',
  language: 'en',
  _links: [],
  pay_api_token: 'test-token',
  return_url: '',
  service_name_path: 'test-service',
  product_name_path: 'test-payment-link',
  requires_captcha: false,
  metadata: {}
} as any)

const mockPublicAuthClient = {
  createTokenForAccount: sinon.stub().resolves({
    token: 'api_test_token123'
  })
}

const mockProductsClient = {
  products: {
    create: sinon.stub().resolves(mockProduct)
  }
}

const { res, req, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/create/create-payment-link.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  })
  .withService({
    externalId: SERVICE_EXTERNAL_ID,
    name: 'Test Service'
  })
  .withUser({
    email: 'test@example.com'
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/clients/public-auth.client': mockPublicAuthClient,
    '@services/clients/pay/ProductsClient.class': sinon.stub().returns(mockProductsClient)
  })
  .build()

describe('Controller: services/payment-links/create', () => {
  afterEach(() => {
    mockResponse.resetHistory()
    mockPublicAuthClient.createTokenForAccount.resetHistory()
    mockProductsClient.products.create.resetHistory()
  })

  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method with correct parameters', () => {
      sinon.assert.calledWith(
        mockResponse,
        sinon.match.any,
        sinon.match.any,
        'simplified-account/services/payment-links/create/index',
        {
          service: sinon.match.object,
          account: sinon.match.object,
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.index,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          ),
          formValues: {}
        }
      )
    })
  })

  describe('post', () => {
    describe('successful creation with fixed amount', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Test Payment Link',
            description: 'A description',
            reference: 'yes',
            referenceLabel: 'Invoice number',
            referenceHint: 'Enter your invoice number',
            amountType: 'fixed',
            amount: '10.50'
          }
        })
        await call('post')
      })

      it('should create API token with correct parameters', () => {
        sinon.assert.calledOnce(mockPublicAuthClient.createTokenForAccount)
        const tokenParams = mockPublicAuthClient.createTokenForAccount.firstCall.args[0]

        expect(tokenParams.accountId).to.equal(GATEWAY_ACCOUNT_ID)
        expect(tokenParams.payload.account_id).to.equal(GATEWAY_ACCOUNT_ID)
        expect(tokenParams.payload.created_by).to.equal('test@example.com')
        expect(tokenParams.payload.type).to.equal('PRODUCTS')
        expect(tokenParams.payload.description).to.equal('Token for "Test Payment Link" payment link')
        expect(tokenParams.payload.token_account_type).to.equal(GatewayAccountType.TEST)
        expect(tokenParams.payload.service_external_id).to.equal(SERVICE_EXTERNAL_ID)
        expect(tokenParams.payload.service_mode).to.equal(GatewayAccountType.TEST)
      })

      it('should create a product with correct parameters', () => {
        sinon.assert.calledOnce(mockProductsClient.products.create)
        const createRequest = mockProductsClient.products.create.firstCall.args[0]
        const payload = createRequest.toPayload()

        expect(payload.pay_api_token).to.equal('api_test_token123')
        expect(payload.gateway_account_id).to.equal(GATEWAY_ACCOUNT_ID)
        expect(payload.name).to.equal('Test Payment Link')
        expect(payload.description).to.equal('A description')
        expect(payload.price).to.equal(1050)
        expect(payload.type).to.equal(ProductType.ADHOC)
        expect(payload.service_name_path).to.equal('test-service')
        expect(payload.product_name_path).to.equal('test-payment-link')
        expect(payload.reference_enabled).to.equal(true)
        expect(payload.reference_label).to.equal('Invoice number')
        expect(payload.reference_hint).to.equal('Enter your invoice number')
        expect(payload.language).to.equal('en')
      })

      it('should redirect to payment links index', () => {
        sinon.assert.calledWith(
          res.redirect,
          formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.paymentLinks.index,
            SERVICE_EXTERNAL_ID,
            GatewayAccountType.TEST
          )
        )
      })
    })

    describe('successful creation with variable amount', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            name: 'Donation Link',
            description: '',
            reference: 'no',
            amountType: 'variable',
            amountHint: 'Please give generously'
          }
        })
        await call('post')
      })

      it('should create a product without price', () => {
        const createRequest = mockProductsClient.products.create.firstCall.args[0]
        const payload = createRequest.toPayload()

        expect(payload.name).to.equal('Donation Link')
        expect(payload.price).to.be.null
        expect(payload.reference_enabled).to.equal(false)
        expect(payload.amount_hint).to.equal('Please give generously')
      })
    })

    describe('validation errors', () => {
      describe('missing required fields', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: '',
              amountType: ''
            }
          })
          await call('post')
        })

        it('should call response with errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match({
              errors: sinon.match.object,
              formValues: sinon.match.object
            })
          )
        })

        it('should not create a token or product', () => {
          sinon.assert.notCalled(mockPublicAuthClient.createTokenForAccount)
          sinon.assert.notCalled(mockProductsClient.products.create)
        })
      })

      describe('invalid amount', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              amountType: 'fixed',
              amount: 'invalid'
            }
          })
          await call('post')
        })

        it('should return validation errors', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })
      })

      describe('amount too low', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              amountType: 'fixed',
              amount: '0.00'
            }
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })
      })

      describe('amount too high', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              amountType: 'fixed',
              amount: '100001'
            }
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })
      })

      describe('title too long', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(231),
              amountType: 'fixed',
              amount: '10'
            }
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })
      })

      describe('title at maximum length', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'a'.repeat(230),
              amountType: 'fixed',
              amount: '10'
            }
          })
          await call('post')
        })

        it('should create product successfully', () => {
          sinon.assert.calledOnce(mockProductsClient.products.create)
        })

        it('should redirect to payment links index', () => {
          sinon.assert.calledWith(
            res.redirect,
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.paymentLinks.index,
              SERVICE_EXTERNAL_ID,
              GatewayAccountType.TEST
            )
          )
        })
      })

      describe('missing reference label when reference enabled', () => {
        beforeEach(async () => {
          nextRequest({
            body: {
              name: 'Test',
              reference: 'yes',
              referenceLabel: '',
              amountType: 'fixed',
              amount: '10'
            }
          })
          await call('post')
        })

        it('should return validation error', () => {
          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/services/payment-links/create/index',
            sinon.match.has('errors')
          )
        })
      })
    })
  })
})
