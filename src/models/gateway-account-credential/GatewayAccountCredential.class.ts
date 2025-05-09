import Credential from '@models/gateway-account-credential/Credential.class'
import { GatewayAccountCredentialData } from '@models/gateway-account-credential/dto/GatewayAccountCredential.dto'

class GatewayAccountCredential {
  public externalId!: string
  public paymentProvider!: string
  public credentials!: Credential
  public state!: string
  public createdDate?: string
  public activeStartDate?: string
  public activeEndDate?: string
  public gatewayAccountId!: number

  withExternalId(externalId: string) {
    this.externalId = externalId
    return this
  }

  withPaymentProvider(paymentProvider: string) {
    this.paymentProvider = paymentProvider
    return this
  }

  withCredentials(credentials: Credential) {
    this.credentials = credentials
    return this
  }

  withState(state: string) {
    if (state) {
      this.state = state
    }
    return this
  }

  withCreatedDate(createdDate: string) {
    this.createdDate = createdDate
    return this
  }

  withActiveStartDate(activeStartDate: string) {
    this.activeStartDate = activeStartDate
    return this
  }

  withActiveEndDate(activeEndDate: string) {
    this.activeEndDate = activeEndDate
    return this
  }

  withGatewayAccountId(gatewayAccountId: number) {
    this.gatewayAccountId = gatewayAccountId
    return this
  }

  static fromJson(data: GatewayAccountCredentialData) {
    return new GatewayAccountCredential()
      .withExternalId(data.external_id)
      .withPaymentProvider(data.payment_provider)
      .withCredentials(Credential.fromJson(data?.credentials))
      .withState(data.state)
      .withCreatedDate(data?.created_date)
      .withActiveStartDate(data?.active_start_date)
      .withActiveEndDate(data?.active_end_date)
      .withGatewayAccountId(data.gateway_account_id)
  }
}

export = GatewayAccountCredential
