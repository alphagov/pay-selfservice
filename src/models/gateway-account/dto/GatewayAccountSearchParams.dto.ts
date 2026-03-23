import { GatewayAccountSearchParams } from '@models/gateway-account/GatewayAccountSearchParams.class'

export class GatewayAccountSearchParamsData {
  readonly accountIds?: string
  readonly serviceIds?: string
  readonly type?: string

  constructor(params: GatewayAccountSearchParams) {
    this.accountIds = params.gatewayAccountIds?.join(',')
    this.serviceIds = params.serviceExternalIds?.join(',')
    this.type = params.gatewayAccountType
  }

  asQueryString(): string {
    const urlParams = new URLSearchParams()

    Object.entries(this).forEach(([key, value]: [string, string]) => {
      if (value !== undefined && value !== null) {
        urlParams.set(key, value)
      }
    })

    return urlParams.toString()
  }
}
