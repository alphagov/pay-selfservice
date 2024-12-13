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

class Credential {
  /**
   *
   * @param {String} stripeAccountId
   * @returns {Credential}
   */
  withStripeAccountId (stripeAccountId) {
    if (stripeAccountId) {
      this.stripeAccountId = stripeAccountId
    }
    return this
  }

  /**
   *
   * @param {WorldpayCredential} oneOffCustomerInitiated
   * @returns {Credential}
   */
  withOneOffCustomerInitiated (oneOffCustomerInitiated) {
    if (oneOffCustomerInitiated && oneOffCustomerInitiated.exists) {
      this.oneOffCustomerInitiated = oneOffCustomerInitiated
    }
    return this
  }

  /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
   * you should instead add any rawResponse data as part of the constructor */
  withRawResponse (data) {
    /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
     * you should instead add any rawResponse data as part of the constructor */
    this.rawResponse = data
    return this
  }

  toJson () {
    return {
      ...this.stripeAccountId && { stripe_account_id: this.stripeAccountId },
      ...this.oneOffCustomerInitiated && { one_off_customer_initiated: this.oneOffCustomerInitiated.toJson() }
    }
  }

  static fromJson (data) {
    return new Credential()
      .withStripeAccountId(data?.stripe_account_id)
      .withOneOffCustomerInitiated(WorldpayCredential.fromJson(data?.one_off_customer_initiated))
      .withRawResponse(data)
  }
}

class WorldpayCredential {
  constructor (exists) {
    this.exists = exists
  }

  withMerchantCode (merchantCode) {
    if (merchantCode) {
      this.merchantCode = merchantCode
    }
    return this
  }

  withUsername (username) {
    if (username) {
      this.username = username
    }
    return this
  }

  withPassword (password) {
    if (password) {
      this.password = password
    }
    return this
  }

  toJson () {
    return {
      ...this.merchantCode && { merchant_code: this.merchantCode },
      ...this.username && { username: this.username },
      ...this.password && { password: this.password }
    }
  }

  static fromJson (data) {
    return new WorldpayCredential(Boolean(data))
      .withMerchantCode(data?.merchant_code)
      .withUsername(data?.username)
      .withPassword(data?.password)
  }
}

module.exports.GatewayAccountCredential = GatewayAccountCredential
module.exports.Credential = Credential
module.exports.WorldpayCredential = WorldpayCredential
module.exports.CREDENTIAL_STATE = CREDENTIAL_STATE
