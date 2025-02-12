class GatewayAccountSwitchPaymentProviderRequest {
  /**
   * @param {String} userExternalId
   */
  withUserExternalId (userExternalId) {
    this.userExternalId = userExternalId
    return this
  }

  /**
   * @param {String} gatewayAccountCredentialExternalId
   */
  withGatewayAccountCredentialExternalId (gatewayAccountCredentialExternalId) {
    this.gatewayAccountCredentialExternalId = gatewayAccountCredentialExternalId
    return this
  }

  /**
   * @returns {Object}
   */
  toPayload () {
    return {
      user_external_id: this.userExternalId,
      gateway_account_credential_external_id: this.gatewayAccountCredentialExternalId
    }
  }
}

module.exports = GatewayAccountSwitchPaymentProviderRequest
