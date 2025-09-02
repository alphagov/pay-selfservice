const proxyquire = require('proxyquire')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const sinon = require('sinon')

const expect = chai.expect

let ProductsClientStub
let CreateProductRequestStub
let ProductTypeStub
let productsService

describe('products service', function () {
  beforeEach(function () {
    // Reset stubs before each test
    ProductsClientStub = undefined
    CreateProductRequestStub = undefined
    ProductTypeStub = undefined
  })

  describe('getProducts', function () {
    it('should retrieve products by gateway account id and product type', async function () {
      const gatewayAccountId = 123
      const productType = 'DEMO'
      const expectedProducts = [
        { id: '1', name: 'Product 1', type: 'DEMO' },
        { id: '2', name: 'Product 2', type: 'DEMO' }
      ]

      const getByGatewayAccountIdAndProductTypeStub = sinon.stub().resolves(expectedProducts)

      ProductsClientStub = function () {
        return {
          products: {
            getByGatewayAccountIdAndProductType: getByGatewayAccountIdAndProductTypeStub
          }
        }
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub }
      })

      const result = await productsService.getProducts(gatewayAccountId, productType)

      expect(getByGatewayAccountIdAndProductTypeStub.calledOnce).to.be.true
      expect(getByGatewayAccountIdAndProductTypeStub.calledWith(gatewayAccountId, productType)).to.be.true
      expect(result).to.deep.equal(expectedProducts)
    })
  })

  describe('getProductByExternalId', function () {
    it('should retrieve product by external id', async function () {
      const productExternalId = 'ext_product_123'
      const expectedProduct = { id: '1', externalId: productExternalId, name: 'Test Product' }

      const getByExternalIdStub = sinon.stub().resolves(expectedProduct)

      ProductsClientStub = function () {
        return {
          products: {
            getByExternalId: getByExternalIdStub
          }
        }
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub }
      })

      const result = await productsService.getProductByExternalId(productExternalId)

      expect(getByExternalIdStub.calledOnce).to.be.true
      expect(getByExternalIdStub.calledWith(productExternalId)).to.be.true
      expect(result).to.deep.equal(expectedProduct)
    })
  })

  describe('deleteProduct', function () {
    it('should delete product by gateway account id and external id', async function () {
      const gatewayAccountId = 456
      const productExternalId = 'ext_product_456'

      const deleteStub = sinon.stub().resolves()

      ProductsClientStub = function () {
        return {
          products: {
            delete: deleteStub
          }
        }
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub }
      })

      await productsService.deleteProduct(gatewayAccountId, productExternalId)

      expect(deleteStub.calledOnce).to.be.true
      expect(deleteStub.calledWith(gatewayAccountId, productExternalId)).to.be.true
    })
  })

  describe('createDemoProduct', function () {
    it('should create a demo product with correct parameters', async function () {
      const token = 'test_token_123'
      const gatewayAccountId = 789
      const paymentDescription = 'Test Demo Payment'
      const paymentAmount = 1000
      const expectedProduct = {
        id: '1',
        name: paymentDescription,
        description: 'Product for Demo Payment',
        price: paymentAmount,
        type: 'DEMO'
      }

      const createStub = sinon.stub().resolves(expectedProduct)
      const withApiTokenStub = sinon.stub().returnsThis()
      const withGatewayAccountIdStub = sinon.stub().returnsThis()
      const withNameStub = sinon.stub().returnsThis()
      const withDescriptionStub = sinon.stub().returnsThis()
      const withPriceStub = sinon.stub().returnsThis()
      const withTypeStub = sinon.stub().returnsThis()

      ProductsClientStub = function () {
        return {
          products: {
            create: createStub
          }
        }
      }

      CreateProductRequestStub = function () {
        return {
          withApiToken: withApiTokenStub,
          withGatewayAccountId: withGatewayAccountIdStub,
          withName: withNameStub,
          withDescription: withDescriptionStub,
          withPrice: withPriceStub,
          withType: withTypeStub
        }
      }

      ProductTypeStub = {
        DEMO: 'DEMO'
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub },
        '@models/products/CreateProductRequest.class': { CreateProductRequest: CreateProductRequestStub },
        '@models/products/product-type': ProductTypeStub
      })

      const result = await productsService.createDemoProduct(token, gatewayAccountId, paymentDescription, paymentAmount)

      // Verify CreateProductRequest builder methods were called with correct parameters
      expect(withApiTokenStub.calledWith(token)).to.be.true
      expect(withGatewayAccountIdStub.calledWith(gatewayAccountId)).to.be.true
      expect(withNameStub.calledWith(paymentDescription)).to.be.true
      expect(withDescriptionStub.calledWith('Product for Demo Payment')).to.be.true
      expect(withPriceStub.calledWith(paymentAmount)).to.be.true
      expect(withTypeStub.calledWith('DEMO')).to.be.true

      // Verify create method was called
      expect(createStub.calledOnce).to.be.true

      expect(result).to.deep.equal(expectedProduct)
    })

    it('should handle create product request building chain correctly', async function () {
      const token = 'another_token'
      const gatewayAccountId = 999
      const paymentDescription = 'Another Demo'
      const paymentAmount = 2500

      const createStub = sinon.stub().resolves({ id: 'created_product' })

      // Create a mock that tracks the chaining
      const mockCreateProductRequest = {
        withApiToken: sinon.stub().returnsThis(),
        withGatewayAccountId: sinon.stub().returnsThis(),
        withName: sinon.stub().returnsThis(),
        withDescription: sinon.stub().returnsThis(),
        withPrice: sinon.stub().returnsThis(),
        withType: sinon.stub().returnsThis()
      }

      ProductsClientStub = function () {
        return {
          products: {
            create: createStub
          }
        }
      }

      CreateProductRequestStub = function () {
        return mockCreateProductRequest
      }

      ProductTypeStub = {
        DEMO: 'DEMO'
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub },
        '@models/products/CreateProductRequest.class': { CreateProductRequest: CreateProductRequestStub },
        '@models/products/product-type': ProductTypeStub
      })

      await productsService.createDemoProduct(token, gatewayAccountId, paymentDescription, paymentAmount)

      // Verify all builder methods were called in sequence
      expect(mockCreateProductRequest.withApiToken.calledBefore(mockCreateProductRequest.withGatewayAccountId)).to.be.true
      expect(mockCreateProductRequest.withGatewayAccountId.calledBefore(mockCreateProductRequest.withName)).to.be.true
      expect(mockCreateProductRequest.withName.calledBefore(mockCreateProductRequest.withDescription)).to.be.true
      expect(mockCreateProductRequest.withDescription.calledBefore(mockCreateProductRequest.withPrice)).to.be.true
      expect(mockCreateProductRequest.withPrice.calledBefore(mockCreateProductRequest.withType)).to.be.true

      // Verify the final create call was made with the built request
      expect(createStub.calledWith(mockCreateProductRequest)).to.be.true
    })
  })

  describe('error handling', function () {
    it('should propagate errors from getProducts', async function () {
      const gatewayAccountId = 123
      const productType = 'DEMO'
      const error = new Error('Products client error')

      const getByGatewayAccountIdAndProductTypeStub = sinon.stub().rejects(error)

      ProductsClientStub = function () {
        return {
          products: {
            getByGatewayAccountIdAndProductType: getByGatewayAccountIdAndProductTypeStub
          }
        }
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub }
      })

      await expect(productsService.getProducts(gatewayAccountId, productType)).to.be.rejectedWith(error)
    })

    it('should propagate errors from getProductByExternalId', async function () {
      const productExternalId = 'ext_product_123'
      const error = new Error('Get product failed')

      const getByExternalIdStub = sinon.stub().rejects(error)

      ProductsClientStub = function () {
        return {
          products: {
            getByExternalId: getByExternalIdStub
          }
        }
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub }
      })

      await expect(productsService.getProductByExternalId(productExternalId)).to.be.rejectedWith(error)
    })

    it('should propagate errors from deleteProduct', async function () {
      const gatewayAccountId = 456
      const productExternalId = 'ext_product_456'
      const error = new Error('Delete failed')

      const deleteStub = sinon.stub().rejects(error)

      ProductsClientStub = function () {
        return {
          products: {
            delete: deleteStub
          }
        }
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub }
      })

      await expect(productsService.deleteProduct(gatewayAccountId, productExternalId)).to.be.rejectedWith(error)
    })

    it('should propagate errors from createDemoProduct', async function () {
      const token = 'test_token'
      const gatewayAccountId = 789
      const paymentDescription = 'Test Demo'
      const paymentAmount = 1000
      const error = new Error('Create failed')

      const createStub = sinon.stub().rejects(error)

      ProductsClientStub = function () {
        return {
          products: {
            create: createStub
          }
        }
      }

      CreateProductRequestStub = function () {
        return {
          withApiToken: sinon.stub().returnsThis(),
          withGatewayAccountId: sinon.stub().returnsThis(),
          withName: sinon.stub().returnsThis(),
          withDescription: sinon.stub().returnsThis(),
          withPrice: sinon.stub().returnsThis(),
          withType: sinon.stub().returnsThis()
        }
      }

      ProductTypeStub = {
        DEMO: 'DEMO'
      }

      productsService = proxyquire('./products.service', {
        '@services/clients/pay/ProductsClient.class': { default: ProductsClientStub },
        '@models/products/CreateProductRequest.class': { CreateProductRequest: CreateProductRequestStub },
        '@models/products/product-type': ProductTypeStub
      })

      await expect(productsService.createDemoProduct(token, gatewayAccountId, paymentDescription, paymentAmount)).to.be.rejectedWith(error)
    })
  })
})
