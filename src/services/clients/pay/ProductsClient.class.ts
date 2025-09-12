import { BaseClient } from '@services/clients/base/Client.class'
import Product from '@models/products/Product.class'
import { ProductData } from '@models/products/dto/Product.dto'
import { CreateProductRequest } from '@models/products/CreateProductRequest.class'
import { CreateProductRequestData } from '@models/products/dto/CreateProductRequest.dto'
import { ProductUpdateRequestData } from '@models/products/dto/ProductUpdateRequest.dto'
import { ProductType } from '@models/products/product-type'

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
      getByGatewayAccountIdAndProductType: async (gatewayAccountId: number, productType: ProductType) => {
        const path = '/v1/api/gateway-account/{gatewayAccountId}/products?type={productType}'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
          .replace('{productType}', encodeURIComponent(productType))
        const response = await this.get<ProductData[]>(path, 'get list of products')
        return response.data.map((productData) => new Product(productData))
      },

      getByGatewayAccountIdAndExternalId: async (gatewayAccountId: number, productExternalId: string) => {
        const path = '/v1/api/gateway-account/{gatewayAccountId}/products/{productExternalId}'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
          .replace('{productExternalId}', encodeURIComponent(productExternalId))
        const response = await this.get<ProductData>(path, 'get a product')
        return new Product(response.data)
      },

      patchByGatewayAccountIdAndExternalId: async (
        gatewayAccountId: number,
        productExternalId: string,
        payload: ProductUpdateRequestData
      ) => {
        const path = '/v1/api/gateway-account/{gatewayAccountId}/products/{productExternalId}'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId))
          .replace('{productExternalId}', encodeURIComponent(productExternalId))
        const response = await this.patch<ProductUpdateRequestData, ProductData>(path, payload, 'update a product')
        return new Product(response.data)
      },

      getByExternalId: async (productExternalId: string) => {
        const path = '/v1/api/products/{productExternalId}'.replace(
          '{productExternalId}',
          encodeURIComponent(productExternalId)
        )
        const response = await this.get<ProductData>(path, 'get a product')
        return new Product(response.data)
      },

      create: async (createProductRequest: CreateProductRequest) => {
        const path = '/v1/api/products'
        const response = await this.post<CreateProductRequestData, ProductData>(
          path,
          createProductRequest.toPayload(),
          'create a product'
        )
        return new Product(response.data)
      },

      delete: async (gatewayAccountId: number, productExternalId: string) => {
        const path = '/v1/api/gateway-account/{gatewayAccountId}/products/{productExternalId}'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId.toString()))
          .replace('{productExternalId}', encodeURIComponent(productExternalId))
        await this.delete<void>(path, 'delete a product')
      },

      disable: async (gatewayAccountId: number, productExternalId: string) => {
        const path = '/v1/api/gateway-account/{gatewayAccountId}/products/{productExternalId}/disable'
          .replace('{gatewayAccountId}', encodeURIComponent(gatewayAccountId.toString()))
          .replace('{productExternalId}', encodeURIComponent(productExternalId))
        await this.patch<void, void>(path, undefined, 'disable a product')
      },
    }
  }
}

export default ProductsClient
