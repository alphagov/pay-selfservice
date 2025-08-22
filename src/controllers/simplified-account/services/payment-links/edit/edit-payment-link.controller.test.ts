import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import Product from '@models/products/Product.class'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'account123abc'
const PRODUCT_EXTERNAL_ID = 'product123abc'

const mockResponse = sinon.stub()
const mockGetProductByGatewayAccountIdAndExternalId = sinon.stub()

const { nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/edit/edit-payment-link.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': {
      getProductByGatewayAccountIdAndExternalId: mockGetProductByGatewayAccountIdAndExternalId,
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
  referenceLabel: 'Reference',
  price: 1000,
  language: 'en',
  links: {
    friendly: {
      href: 'https://test.example.com/pay/test-link'
    }
  },
  metadata: {
    'column1': 'value1',
    'column2': 'value2'
  }
} as unknown as Product

describe('controller: services/payment-links/edit/edit-payment-link', () => {
  describe('get', () => {
    describe('with valid product', () => {
      beforeEach(async () => {
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
          'simplified-account/services/payment-links/edit/overview'
        )
      })

      it('should set product details in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const product = context.product as Record<string, unknown>
        sinon.assert.match(product.name, 'Test Payment Link')
        sinon.assert.match(product.details, 'Test Description')
        sinon.assert.match(product.reference, 'Reference')
        sinon.assert.match(product.amount, '£10.00')
        sinon.assert.match(product.webAddress, 'https://test.example.com/pay/test-link')
      })

      it('should set metadata in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const product = context.product as Record<string, unknown>
        const metadata = product.metadata as Record<string, Record<string, string>>
        sinon.assert.match(metadata, sinon.match.object)
        sinon.assert.match(metadata.column1.value, 'value1')
        sinon.assert.match(metadata.column2.value, 'value2')

        sinon.assert.match(metadata.column1.link, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.metadata.update,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID,
          'column1'
        ))

        sinon.assert.match(metadata.column2.link, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.metadata.update,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID,
          'column2'
        ))
      })

      it('should set service mode in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.serviceMode, GatewayAccountType.TEST)
      })

      it('should set edit links in context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>

        sinon.assert.match(context.editInformationLink, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.information,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID,
        ))

        sinon.assert.match(context.editReferenceLink, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.reference,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID,
        ))

        sinon.assert.match(context.editAmountLink, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.amount,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID,
        ))

        sinon.assert.match(context.addReportingColumnLink, formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.paymentLinks.edit.metadata.add,
          SERVICE_EXTERNAL_ID,
          GatewayAccountType.TEST,
          PRODUCT_EXTERNAL_ID,
        ))
      })
    })

    describe('with product without description', () => {
      beforeEach(async () => {
        const productWithoutDescription = {
          ...mockProduct,
          description: undefined
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(productWithoutDescription)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should set default description when none provided', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const product = context.product as Record<string, unknown>
        sinon.assert.match(product.details, 'None given')
      })
    })

    describe('with variable amount product', () => {
      beforeEach(async () => {
        const variableAmountProduct = {
          ...mockProduct,
          price: 0
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(variableAmountProduct)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should show user choosable amount for variable pricing', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const product = context.product as Record<string, unknown>
        sinon.assert.match(product.amount, 'User can choose')
      })
    })

    describe('with product without reference label', () => {
      beforeEach(async () => {
        const productWithoutReference = {
          ...mockProduct,
          referenceLabel: undefined
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(productWithoutReference)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should set default reference when none provided', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const product = context.product as Record<string, unknown>
        sinon.assert.match(product.reference, 'Created by GOV.UK Pay')
      })
    })

    describe('with product without metadata', () => {
      beforeEach(async () => {
        const productWithoutMetadata = {
          ...mockProduct,
          metadata: undefined
        }
        mockGetProductByGatewayAccountIdAndExternalId.resolves(productWithoutMetadata)
        mockResponse.resetHistory()

        nextRequest({
          params: { productExternalId: PRODUCT_EXTERNAL_ID },
        })
        await call('get')
      })

      it('should not include metadata in context when none exists', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const product = context.product as Record<string, unknown>
        sinon.assert.match(product.metadata, undefined)
      })
    })
  })
})
