import ProductsClient from '@services/clients/pay/ProductsClient.class'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import Product from '@models/products/Product.class'
import ProductType from '@models/products/product-type'
import { ProductUpdateRequestData } from '@models/products/dto/ProductUpdateRequest.dto'

const productsClient = new ProductsClient()

const getProducts = (gatewayAccountId: number, productType: string) =>
  productsClient.products.getByGatewayAccountIdAndProductType(gatewayAccountId, productType)

const getProductByExternalId = (productExternalId: string) => productsClient.products.getByExternalId(productExternalId)

const getProductByGatewayAccountIdAndExternalId = (gatewayAccountId: number, productExternalId: string) =>
  productsClient.products.getByGatewayAccountIdAndExternalId(gatewayAccountId, productExternalId)

const deleteProduct = (gatewayAccountId: number, productExternalId: string) =>
  productsClient.products.delete(gatewayAccountId, productExternalId)

const updateProduct = (gatewayAccountId: number, productExternalId: string, updateRequest: ProductUpdateRequestData) =>
  productsClient.products.patchByGatewayAccountIdAndExternalId(gatewayAccountId, productExternalId, updateRequest)

const createProduct = (createProductRequest: CreateProductRequest) =>
  productsClient.products.create(createProductRequest)

const createDemoProduct = async (
  token: string,
  gatewayAccountId: number,
  paymentDescription: string,
  paymentAmount: number
) => {
  const createProductRequest = new CreateProductRequest()
    .withApiToken(token)
    .withGatewayAccountId(gatewayAccountId)
    .withName(paymentDescription)
    .withDescription('Product for Demo Payment')
    .withPrice(paymentAmount)
    .withType(ProductType.DEMO)

  return productsClient.products.create(createProductRequest)
}

export {
  getProducts,
  getProductByExternalId,
  getProductByGatewayAccountIdAndExternalId,
  deleteProduct,
  updateProduct,
  createDemoProduct,
  createProduct,
}
