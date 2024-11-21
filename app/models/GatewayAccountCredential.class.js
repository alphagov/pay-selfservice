class GatewayAccountCredential {
  constructor (data) {
    this.externalId = data.external_id
    this.paymentProvider = data.payment_provider
    this.credentials = new Credential(data.credentials)
    this.state = data.state
    this.createdDate = data.created_date
    this.activeStartDate = data.active_start_date
    this.activeEndDate = data.active_end_date
    this.gatewayAccountId = data.gateway_account_id
  }
}

class Credential {
  constructor (data) {
    this.stripeAccountId = data.stripe_account_id
    this.rawResponse = data
  }
}

module.exports = GatewayAccountCredential
