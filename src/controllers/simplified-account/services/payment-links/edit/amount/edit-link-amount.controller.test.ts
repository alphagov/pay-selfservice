import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'
import { poundsToPence } from '@utils/currency-formatter'
import Product from '@models/products/Product.class'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const PRODUCT_EXTERNAL_ID = 'product123abc'

const mockResponse = sinon.spy()
const mockGetProductByGatewayAccountIdAndExternalId = sinon.stub()
const mockUpdateProduct = sinon.stub()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/edit/amount/edit-link-amount.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': {
      getProductByGatewayAccountIdAndExternalId: mockGetProductByGatewayAccountIdAndExternalId,
      updateProduct: mockUpdateProduct,
    },
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
  .withParams({
    productExternalId: PRODUCT_EXTERNAL_ID,
  })
  .build()

const mockProduct = {
  externalId: PRODUCT_EXTERNAL_ID,
  name: 'Test Payment Link',
  description: 'Test Description',
  price: 1000,
  amountHint: 'Enter amount',
  language: 'en',
} as Product

describe('controller: services/payment-links/edit/amount/edit-link-amount', () => {
  describe('get', () => {
    describe('with fixed amount product', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should call getProductByGatewayAccountIdAndExternalId with correct parameters', () => {
        sinon.assert.calledWith(
          mockGetProductByGatewayAccountIdAndExternalId,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID
        )
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass correct template path to the response method', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/edit/amount'
        )
      })

      it('should set form values for fixed amount product', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, string>
        sinon.assert.match(formValues.amountTypeGroup, 'fixed')
        sinon.assert.match(formValues.paymentAmount, '10.00')
        sinon.assert.match(formValues.amountHint, 'Enter amount')
      })

      it('should set back link in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.index,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID
        ))
      })

      it('should set isWelsh to false for English language', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, false)
      })
    })

    describe('with variable amount product', () => {
      before(async () => {
        const variableProduct = {
          ...mockProduct,
          price: 0,
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(variableProduct)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should set form values for variable amount product', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, string>
        sinon.assert.match(formValues.amountTypeGroup, 'variable')
        sinon.assert.match(formValues.paymentAmount, undefined)
        sinon.assert.match(formValues.amountHint, 'Enter amount')
      })
    })

    describe('with Welsh product', () => {
      before(async () => {
        const welshProduct = {
          ...mockProduct,
          language: 'cy',
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(welshProduct)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should set isWelsh to true for Welsh language', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, true)
      })
    })
  })

  describe('post', () => {
    describe('with valid fixed amount data', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            amountTypeGroup: 'fixed',
            paymentAmount: '15.50',
            amountHint: 'Payment amount',
          },
        })

        await call('post')
      })

      it('should call updateProduct with correct parameters', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setAmount({
            price: 1550,
            hint: 'Payment amount',
          })
          .build()

        sinon.assert.calledWith(
          mockUpdateProduct,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID,
          expectedProductUpdateRequest
        )
      })

      it('should redirect to edit overview page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.index,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID
        ))
      })
    })

    describe('with valid variable amount data', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            amountTypeGroup: 'variable',
            paymentAmount: '',
            amountHint: 'Enter your amount',
          },
        })

        await call('post')
      })

      it('should call updateProduct with zero price for variable amount', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setAmount({
            price: 0,
            hint: 'Enter your amount',
          })
          .build()

        sinon.assert.calledWith(
          mockUpdateProduct,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID,
          expectedProductUpdateRequest
        )
      })

      it('should redirect to edit overview page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(SERVICE_EXTERNAL_ID))
        sinon.assert.calledWith(res.redirect, sinon.match(GatewayAccountType.TEST))
        sinon.assert.calledWith(res.redirect, sinon.match(PRODUCT_EXTERNAL_ID))
      })
    })

    describe('with validation errors - no amount type selected', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            amountTypeGroup: '',
            paymentAmount: '10.00',
            amountHint: 'Test hint',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/edit/amount'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with validation errors - fixed amount but no price', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            amountTypeGroup: 'fixed',
            paymentAmount: '',
            amountHint: 'Test hint',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should preserve form values in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.formValues, sinon.match.object)
      })
    })

    describe('with validation errors - invalid amount format', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            amountTypeGroup: 'fixed',
            paymentAmount: 'invalid-amount',
            amountHint: 'Test hint',
          },
        })

        await call('post')
      })

      it('should render the form with errors', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })
  })
})
