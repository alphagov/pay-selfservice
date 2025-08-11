import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'
import Product from '@models/products/Product.class'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const PRODUCT_EXTERNAL_ID = 'product123abc'

const mockResponse = sinon.spy()
const mockGetProductByGatewayAccountIdAndExternalId = sinon.stub()
const mockUpdateProduct = sinon.stub()

const { nextRequest, call, res, req } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/edit/metadata/add-link-metadata.controller'
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
  language: 'en',
  metadata: {
    existing_column: 'existing_value',
  },
} as unknown as Product

describe('controller: services/payment-links/edit/metadata/add-link-metadata', () => {
  describe('get', () => {
    describe('with valid product', () => {
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
          'simplified-account/services/payment-links/edit/metadata'
        )
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

      it('should set createJourney to true', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.createJourney, true)
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
    describe('with valid data', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()
        req.flash.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            reportingColumn: 'new_column',
            cellContent: 'new_value',
          },
          flash: req.flash,
        })

        await call('post')
      })

      it('should call updateProduct with correct parameters including new metadata', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setMetadata({
            existing_column: 'existing_value',
            new_column: 'new_value'
          })
          .build()

        sinon.assert.calledWith(
          mockUpdateProduct,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID,
          expectedProductUpdateRequest
        )
      })

      it('should set success flash message', () => {
        sinon.assert.calledWith(
          req.flash,
          'messages',
          sinon.match({
            state: 'success',
            icon: '&check;',
            heading: 'Reporting column added',
          })
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

    describe('with validation errors - empty reporting column', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            reportingColumn: '',
            cellContent: 'valid content',
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
          'simplified-account/services/payment-links/edit/metadata'
        )
      })

      it('should include errors in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })

      it('should preserve form values in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, unknown>
        sinon.assert.match(formValues.reportingColumn, '')
        sinon.assert.match(formValues.cellContent, 'valid content')
      })

      it('should set createJourney to true', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.createJourney, true)
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with validation errors - empty cell content', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            reportingColumn: 'valid_column',
            cellContent: '',
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

      it('should set back link and other context properties', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.backLink, sinon.match.string)
        sinon.assert.match(context.serviceMode, GatewayAccountType.TEST)
        sinon.assert.match(context.isWelsh, false)
      })
    })

    describe('with validation errors - duplicate reporting column', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            reportingColumn: 'existing_column',
            cellContent: 'new value',
          },
        })

        await call('post')
      })

      it('should render the form with errors for duplicate column', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })

    describe('with validation errors - column name too long', () => {
      before(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
          body: {
            reportingColumn: 'a'.repeat(31),
            cellContent: 'valid content',
          },
        })

        await call('post')
      })

      it('should render the form with errors for invalid column format', () => {
        sinon.assert.calledOnce(mockResponse)
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.errors, sinon.match.object)
        sinon.assert.match(context.errors, sinon.match.has('summary'))
        sinon.assert.match(context.errors, sinon.match.has('formErrors'))
      })
    })
  })
})
