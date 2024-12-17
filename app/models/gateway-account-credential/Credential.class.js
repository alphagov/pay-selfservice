const WorldpayCredential = require('./WorldpayCredential.class')

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
    if (oneOffCustomerInitiated) {
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

module.exports = Credential
