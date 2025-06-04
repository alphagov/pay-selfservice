import ProductsClient from '@services/clients/pay/ProductsClient.class'

const productsClient = new ProductsClient()

const getProducts = (gatewayAccountId: number, productType: string) =>
  productsClient.products.getProductsByGatewayAccountIdAndProductType(gatewayAccountId, productType)

export {
  getProducts
}
