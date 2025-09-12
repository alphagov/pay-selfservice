import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import Product from '@models/products/Product.class'
import { validProductResponse } from '@test/fixtures/product.fixtures'
import { ProductData } from '@models/products/dto/Product.dto'
import { ProductType } from '@models/products/product-type'
import { afterEach } from 'mocha'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117

const PRODUCT_NO_REF_NO_AMOUNT_NO_DETAIL = new Product(
  validProductResponse({
    name: 'Designer monocles',
    type: ProductType.ADHOC,
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    service_name_path: 'mcduck-enterprises',
    product_name_path: 'designer-monocles',
  }) as ProductData
)

const PRODUCT_REF_AMOUNT_DETAIL = new Product(
  validProductResponse({
    name: 'Designer monocles',
    type: ProductType.ADHOC,
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    service_name_path: 'mcduck-enterprises',
    product_name_path: 'designer-monocles',
    price: 999999,
    reference_enabled: true,
    reference_label: 'Invoice number',
    description: 'Eyewear for the discerning trillionaire',
  }) as ProductData
)

const mockResponse = sinon.stub()
const mockProductsService = {
  getProducts: sinon.stub().resolves([]),
}

const { call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/payment-links/payment-links.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/products.service': mockProductsService,
  })
  .withUser({
    isAdminUserForService: () => true,
  })
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  })
  .build()

describe('controller: services/payment-links', () => {
  describe('get', () => {
    describe('product with ref, amount, details', () => {
      beforeEach(async () => {
        mockProductsService.getProducts.resolves([PRODUCT_REF_AMOUNT_DETAIL])
        await call('get')
      })

      afterEach(() => {
        mockProductsService.getProducts.resolves([])
      })

      it('should call the response method with expected params', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/index',
          {
            isAdmin: true,
            messages: [],
            serviceMode: GatewayAccountType.TEST,
            createLink: '/service/service123abc/account/test/payment-links/create',
            products: [
              {
                language: 'en',
                name: 'Designer monocles',
                href: 'http://products-ui.url/redirect/mcduck-enterprises/designer-monocles',
                reference: 'Invoice number',
                details: 'Eyewear for the discerning trillionaire',
                amount: '£9,999.99',
                editLink: '/service/service123abc/account/test/payment-links/cf3hp2',
                deleteLink: '/service/service123abc/account/test/payment-links/cf3hp2/delete',
              },
            ],
          }
        )
      })
    })

    describe('product with no ref, no amount, no details', () => {
      beforeEach(async () => {
        mockProductsService.getProducts.resolves([PRODUCT_NO_REF_NO_AMOUNT_NO_DETAIL])
        nextRequest({
          user: {
            isAdminUserForService: () => false,
          },
          account: {
            type: GatewayAccountType.LIVE,
          },
        })
        await call('get')
      })

      afterEach(() => {
        mockProductsService.getProducts.resolves([])
      })

      it('should call the response method with expected params', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/payment-links/index',
          {
            isAdmin: false,
            messages: [],
            serviceMode: GatewayAccountType.LIVE,
            createLink: '/service/service123abc/account/live/payment-links/create',
            products: [
              {
                language: 'en',
                name: 'Designer monocles',
                href: 'http://products-ui.url/redirect/mcduck-enterprises/designer-monocles',
                reference: 'Created by GOV.UK Pay',
                details: undefined,
                amount: 'User can choose',
                editLink: '/service/service123abc/account/live/payment-links/cf3hp2',
                deleteLink: '/service/service123abc/account/live/payment-links/cf3hp2/delete',
              },
            ],
          }
        )
      })
    })
  })
})
