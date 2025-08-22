import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import Product from '@models/products/Product.class'
import { ProductUpdateRequestBuilder } from '@models/products/ProductUpdateRequest.class'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const PRODUCT_EXTERNAL_ID = 'product123abc'
const METADATA_KEY = 'existing_column'

const mockResponse = sinon.stub()
const mockGetProductByGatewayAccountIdAndExternalId = sinon.stub()
const mockUpdateProduct = sinon.stub()

const { nextRequest, call, res, req, next } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/edit/metadata/edit-link-metadata.controller'
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
    metadataKey: METADATA_KEY,
  })
  .build()

const mockProduct = {
  externalId: PRODUCT_EXTERNAL_ID,
  name: 'Test Payment Link',
  description: 'Test Description',
  language: 'en',
  metadata: {
    existing_column: 'existing_value',
    another_column: 'another_value',
  },
} as unknown as Product

describe('controller: services/payment-links/edit/metadata/edit-link-metadata', () => {
  describe('get', () => {
    describe('with valid metadata key', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
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

      it('should set form values in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const formValues = context.formValues as Record<string, string>
        sinon.assert.match(formValues.reportingColumn, METADATA_KEY)
        sinon.assert.match(formValues.cellContent, 'existing_value')
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

    describe('with invalid metadata key', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        next.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: 'non_existent_key'
          },
        })
        await call('get')
      })

      it('should call next with NotFoundError', () => {
        sinon.assert.calledOnce(next)
        sinon.assert.calledWith(next, sinon.match.instanceOf(Error))
      })
    })

    describe('with Welsh product', () => {
      beforeEach(async () => {
        const welshProduct = {
          ...mockProduct,
          language: 'cy',
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(welshProduct)
        mockResponse.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
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
    describe('with valid edit action', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()
        req.flash.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
          body: {
            action: 'edit',
            reportingColumn: 'updated_column',
            cellContent: 'updated_value',
          },
          flash: req.flash,
        })

        await call('post')
      })

      it('should call updateProduct with correct parameters', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setMetadata({
            updated_column: 'updated_value',
            another_column: 'another_value'
          })
          .build()

        sinon.assert.calledWith(
          mockUpdateProduct,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID,
          expectedProductUpdateRequest
        )
      })

      it('should set success flash message for edit', () => {
        sinon.assert.calledWith(
          req.flash,
          'messages',
          sinon.match({
            state: 'success',
            icon: '&check;',
            heading: 'Reporting columns updated',
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

    describe('with valid delete action', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockUpdateProduct.resolves()
        res.redirect.resetHistory()
        req.flash.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
          body: {
            action: 'delete',
            reportingColumn: '',
            cellContent: '',
          },
          flash: req.flash,
        })

        await call('post')
      })

      it('should call updateProduct with metadata key removed', () => {
        const expectedProductUpdateRequest = ProductUpdateRequestBuilder.fromProduct(mockProduct)
          .setMetadata({
            another_column: 'another_value'
          })
          .build()

        sinon.assert.calledWith(
          mockUpdateProduct,
          GATEWAY_ACCOUNT_ID,
          PRODUCT_EXTERNAL_ID,
          expectedProductUpdateRequest
        )
      })

      it('should set success flash message for delete', () => {
        sinon.assert.calledWith(
          req.flash,
          'messages',
          sinon.match({
            state: 'success',
            icon: '&check;',
            heading: 'Reporting column deleted',
          })
        )
      })

      it('should redirect to edit overview page', () => {
        sinon.assert.calledOnce(res.redirect)
        sinon.assert.calledWith(res.redirect, sinon.match(SERVICE_EXTERNAL_ID))
        sinon.assert.calledWith(res.redirect, sinon.match(GatewayAccountType.TEST))
        sinon.assert.calledWith(res.redirect, sinon.match(PRODUCT_EXTERNAL_ID))
      })
    })

    describe('with invalid metadata key', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        next.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: 'non_existent_key'
          },
          body: {
            action: 'edit',
            reportingColumn: 'new_column',
            cellContent: 'new_value',
          },
        })
        await call('post')
      })

      it('should call next with NotFoundError', () => {
        sinon.assert.calledOnce(next)
        sinon.assert.calledWith(next, sinon.match.instanceOf(Error))
      })
    })

    describe('with validation errors - edit action with empty column name', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
          body: {
            action: 'edit',
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
        sinon.assert.match(context.formValues, sinon.match.object)
      })

      it('should not redirect', () => {
        sinon.assert.notCalled(res.redirect)
      })
    })

    describe('with validation errors - edit action with empty cell content', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
          body: {
            action: 'edit',
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

    describe('with validation errors - duplicate column name', () => {
      beforeEach(async () => {
        mockGetProductByGatewayAccountIdAndExternalId.resolves(mockProduct)
        mockResponse.resetHistory()
        res.redirect.resetHistory()

        nextRequest({
          params: {
            productExternalId: PRODUCT_EXTERNAL_ID,
            metadataKey: METADATA_KEY
          },
          body: {
            action: 'edit',
            reportingColumn: 'another_column',
            cellContent: 'valid content',
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
  })
})
