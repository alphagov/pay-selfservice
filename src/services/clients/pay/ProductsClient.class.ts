import { BaseClient } from '@services/clients/base/Client.class'
import Product from '@models/products/Product.class'
import { ProductData } from '@models/products/dto/Product.dto'

const SERVICE_NAME = 'products'
const SERVICE_BASE_URL = process.env.PRODUCTS_URL!

class ProductsClient extends BaseClient {
  public products

  constructor() {
    super(SERVICE_BASE_URL, SERVICE_NAME)
    this.products = this.productsClient
  }

  private get productsClient() {
    return {
      getProductsByGatewayAccountIdAndProductType: async (gatewayAccountId: number, productType: string) => {
        const path = '/v1/api/gateway-account/{gatewayAccountId}/products?type={productType}'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
          .replace('{productType}', encodeURIComponent(productType))
        const response = await this.get<ProductData[]>(path, 'get list of products')
        return response.data.map((productData) => new Product(productData))
      },
    }
  }
}

export = ProductsClient
