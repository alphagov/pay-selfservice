const Credential = require('./Credential.class')

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
    this.credentials = Credential.fromJson(data.credentials)
    this.state = data.state
    this.createdDate = data.created_date
    this.activeStartDate = data.active_start_date
    this.activeEndDate = data.active_end_date
    this.gatewayAccountId = data.gateway_account_id
  }
}

module.exports.GatewayAccountCredential = GatewayAccountCredential
module.exports.Credential = Credential
module.exports.CREDENTIAL_STATE = CREDENTIAL_STATE
