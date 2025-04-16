interface GatewayAccountSwitchPaymentProviderRequestData {
  user_external_id?: string
  gateway_account_credential_external_id?: string
}

class GatewayAccountSwitchPaymentProviderRequest {
  public userExternalId?: string
  public gatewayAccountCredentialExternalId?: string

  withUserExternalId (userExternalId: string) {
    this.userExternalId = userExternalId
    return this
  }

  withGatewayAccountCredentialExternalId (gatewayAccountCredentialExternalId: string) {
    this.gatewayAccountCredentialExternalId = gatewayAccountCredentialExternalId
    return this
  }

  toPayload (): GatewayAccountSwitchPaymentProviderRequestData {
    return {
      user_external_id: this.userExternalId,
      gateway_account_credential_external_id: this.gatewayAccountCredentialExternalId
    }
  }
}

export = GatewayAccountSwitchPaymentProviderRequest
