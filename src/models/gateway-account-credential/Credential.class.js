const WorldpayCredential = require('./WorldpayCredential.class')

class Credential {
  /**
   *
   * @param {String} stripeAccountId
   * @returns {Credential}
   */
  withStripeAccountId (stripeAccountId) {
    this.stripeAccountId = stripeAccountId
    return this
  }

  /**
   *
   * @param {WorldpayCredential} oneOffCustomerInitiated
   * @returns {Credential}
   */
  withOneOffCustomerInitiated (oneOffCustomerInitiated) {
    this.oneOffCustomerInitiated = oneOffCustomerInitiated
    return this
  }

  /**
   *
   * @param {WorldpayCredential} recurringCustomerInitiated
   * @returns {Credential}
   */
  withRecurringCustomerInitiated (recurringCustomerInitiated) {
    this.recurringCustomerInitiated = recurringCustomerInitiated
    return this
  }

  /**
   *
   * @param {WorldpayCredential} recurringMerchantInitated
   * @returns {Credential}
   */
  withRecurringMerchantInitiated (recurringMerchantInitated) {
    this.recurringMerchantInitated = recurringMerchantInitated
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
    const credential = new Credential()
      .withRawResponse(data)
    if (data?.stripe_account_id) {
      credential.withStripeAccountId(data.stripe_account_id)
    }
    if (data?.one_off_customer_initiated) {
      credential.withOneOffCustomerInitiated(WorldpayCredential.fromJson(data.one_off_customer_initiated))
    }
    if (data?.recurring_customer_initiated) {
      credential.withRecurringCustomerInitiated(WorldpayCredential.fromJson(data.recurring_customer_initiated))
    }
    if (data?.recurring_merchant_initiated) {
      credential.withRecurringMerchantInitiated(WorldpayCredential.fromJson(data.recurring_merchant_initiated))
    }
    return credential
  }
}

module.exports = Credential
