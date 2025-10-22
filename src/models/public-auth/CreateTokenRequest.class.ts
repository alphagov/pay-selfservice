import { CreateTokenRequestData } from '@models/public-auth/dto/CreateTokenRequest.dto'

export class CreateTokenRequest {
  private gatewayAccountId!: string
  private serviceExternalId!: string
  private serviceMode!: string
  private description!: string
  private createdBy!: string
  private tokenUsageType!: string
  private tokenAccountType?: string
  private tokenType?: string

  withGatewayAccountId(gatewayAccountId: string) {
    this.gatewayAccountId = gatewayAccountId
    return this
  }

  withServiceExternalId(serviceExternalId: string) {
    this.serviceExternalId = serviceExternalId
    return this
  }

  withServiceMode(serviceMode: string) {
    this.serviceMode = serviceMode
    return this
  }

  withDescription(description: string) {
    this.description = description
    return this
  }

  withCreatedBy(createdBy: string) {
    this.createdBy = createdBy
    return this
  }

  withTokenUsageType(tokenUsageType: string) {
    this.tokenUsageType = tokenUsageType
    return this
  }

  withTokenAccountType(tokenAccountType: string) {
    this.tokenAccountType = tokenAccountType
    return this
  }

  withTokenType(tokenType: string) {
    this.tokenType = tokenType
    return this
  }

  toPayload(): CreateTokenRequestData {
    return {
      account_id: this.gatewayAccountId,
      service_external_id: this.serviceExternalId,
      service_mode: this.serviceMode,
      description: this.description,
      created_by: this.createdBy,
      type: this.tokenUsageType,
      token_account_type: this.tokenAccountType,
      token_type: this.tokenType,
    }
  }
}
