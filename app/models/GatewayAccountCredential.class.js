const CREDENTIAL_STATE = {
  CREATED: 'CREATED',
  ENTERED: 'ENTERED',
  VERIFIED: 'VERIFIED_WITH_LIVE_PAYMENT',
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED'
}

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
    /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
     * you should instead add any rawResponse data as part of the constructor */
    this.rawResponse = data
  }
}

module.exports.GatewayAccountCredential = GatewayAccountCredential
module.exports.CREDENTIAL_STATE = CREDENTIAL_STATE
