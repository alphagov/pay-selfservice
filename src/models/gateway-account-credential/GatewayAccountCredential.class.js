const Credential = require('./Credential.class')

class GatewayAccountCredential {
  withExternalId (externalId) {
    this.externalId = externalId
    return this
  }

  withPaymentProvider (paymentProvider) {
    this.paymentProvider = paymentProvider
    return this
  }

  withCredentials (credentials) {
    this.credentials = credentials
    return this
  }

  withState (state) {
    if (state) {
      this.state = state
    }
    return this
  }

  withCreatedDate (createdDate) {
    this.createdDate = createdDate
    return this
  }

  withActiveStartDate (activeStartDate) {
    this.activeStartDate = activeStartDate
    return this
  }

  withActiveEndDate (activeEndDate) {
    this.activeEndDate = activeEndDate
    return this
  }

  withGatewayAccountId (gatewayAccountId) {
    this.gatewayAccountId = gatewayAccountId
    return this
  }

  /**
   *
   * @param data
   * @returns {GatewayAccountCredential}
   */
  static fromJson (data) {
    return new GatewayAccountCredential()
      .withExternalId(data?.external_id)
      .withPaymentProvider(data?.payment_provider)
      .withCredentials(Credential.fromJson(data?.credentials))
      .withState(data?.state)
      .withCreatedDate(data?.created_date)
      .withActiveStartDate(data?.active_start_date)
      .withActiveEndDate(data?.active_end_date)
      .withGatewayAccountId(data?.gateway_account_id)
  }
}

module.exports.GatewayAccountCredential = GatewayAccountCredential
module.exports.Credential = Credential
