import ProductsClient from '@services/clients/pay/ProductsClient.class'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import ProductType from '@models/products/product-type'

const productsClient = new ProductsClient()

const getProducts = (gatewayAccountId: number, productType: string) =>
  productsClient.products.getByGatewayAccountIdAndProductType(gatewayAccountId, productType)

const getProductByExternalId = (productExternalId: string) => productsClient.products.getByExternalId(productExternalId)

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

export { getProducts, getProductByExternalId, createDemoProduct }
