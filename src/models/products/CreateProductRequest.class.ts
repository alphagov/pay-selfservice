import { CreateProductRequestData } from '@models/products/dto/CreateProductRequest.dto'

export class CreateProductRequest {
  private apiToken!: string
  private gatewayAccountId!: number
  private name!: string
  private description!: string
  private price!: number
  private type!: string

  withApiToken(apiToken: string) {
    this.apiToken = apiToken
    return this
  }

  withGatewayAccountId(gatewayAccountId: number) {
    this.gatewayAccountId = gatewayAccountId
    return this
  }

  withName(name: string) {
    this.name = name
    return this
  }

  withDescription(description: string) {
    this.description = description
    return this
  }

  withPrice(price: number) {
    this.price = price
    return this
  }

  withType(type: string) {
    this.type = type
    return this
  }

  toPayload(): CreateProductRequestData {
    return {
      pay_api_token: this.apiToken,
      gateway_account_id: this.gatewayAccountId,
      name: this.name,
      description: this.description,
      price: this.price,
      type: this.type
    }
  }
}
