import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import Product from '@models/products/Product.class'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const PRODUCT_EXTERNAL_ID = 'product123abc'

const mockResponse = sinon.spy()
const mockGetProductByGatewayAccountIdAndExternalId = sinon.stub()
const mockUpdateProduct = sinon.stub()

const { nextRequest, call, res } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/edit/reference/edit-link-reference.controller'
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
  referenceEnabled: true,
  referenceLabel: 'Order Number',
  referenceHint: 'Enter your order number',
  language: 'en',
} as Product

describe('controller: services/payment-links/edit/reference/edit-link-reference', () => {
  describe('get', () => {
    describe('with custom reference product', () => {
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
          'simplified-account/services/payment-links/edit/reference'
        )
      })

      it('should set form values for custom reference type', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, string>
        sinon.assert.match(formValues.referenceTypeGroup, 'custom')
        sinon.assert.match(formValues.referenceLabel, 'Order Number')
        sinon.assert.match(formValues.referenceHint, 'Enter your order number')
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

      it('should set service mode in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.serviceMode, GatewayAccountType.TEST)
      })

      it('should set isWelsh to false for English language', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.isWelsh, false)
      })
    })

    describe('with standard reference product', () => {
      before(async () => {
        const standardReferenceProduct = {
          ...mockProduct,
          referenceEnabled: false,
          referenceLabel: undefined,
          referenceHint: undefined,
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(standardReferenceProduct)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should set form values for standard reference type', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, string>
        sinon.assert.match(formValues.referenceTypeGroup, 'standard')
        sinon.assert.match(formValues.referenceLabel, undefined)
        sinon.assert.match(formValues.referenceHint, undefined)
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
    describe('with valid standard reference type', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            referenceTypeGroup: 'standard',
            referenceLabel: '',
            referenceHint: '',
          },
        })

        await call('post')
      })

      it('should call updateProduct with correct parameters', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setReference({
            enabled: false,
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

    describe('with valid custom reference type', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            referenceTypeGroup: 'custom',
            referenceLabel: 'Invoice Number',
            referenceHint: 'Enter your invoice number',
          },
        })

        await call('post')
      })

      it('should call updateProduct with correct parameters', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setReference({
            enabled: true,
            label: 'Invoice Number',
            hint: 'Enter your invoice number',
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

    describe('with validation errors - no reference type selected', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            referenceTypeGroup: '',
            referenceLabel: 'Valid Label',
            referenceHint: 'Valid Hint',
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
          'simplified-account/services/payment-links/edit/reference'
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

    describe('with validation errors - custom type but empty label', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            referenceTypeGroup: 'custom',
            referenceLabel: '',
            referenceHint: 'Valid hint',
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

      it('should set back link and other context properties', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.serviceMode, GatewayAccountType.TEST)
        sinon.assert.match(context.isWelsh, false)
      })
    })

    describe('with validation errors - custom type with label too long', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        const longLabel = 'a'.repeat(51)
        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            referenceTypeGroup: 'custom',
            referenceLabel: longLabel,
            referenceHint: 'Valid hint',
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

    describe('with validation errors - custom type with hint too long', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        const longHint = 'a'.repeat(256)
        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            referenceTypeGroup: 'custom',
            referenceLabel: 'Valid Label',
            referenceHint: longHint,
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
