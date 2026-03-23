import { GatewayAccountSearchParamsData } from '@models/gateway-account/dto/GatewayAccountSearchParams.dto'

export class GatewayAccountSearchParams {
  // TODO complete this class

  gatewayAccountIds?: string[]
  serviceExternalIds?: string[]
  gatewayAccountType?: string

  withGatewayAccountIds(gatewayAccountIds: string[]) {
    this.gatewayAccountIds = gatewayAccountIds
    return this
  }

  withServiceExternalIds(serviceExternalIds: string[]) {
    this.serviceExternalIds = serviceExternalIds
    return this
  }

  withGatewayAccountType(gatewayAccountType: string) {
    this.gatewayAccountType = gatewayAccountType
    return this
  }

  toJson() {
    return new GatewayAccountSearchParamsData(this)
  }
}
