'use strict'

/**
 * @class DirectDebitGatewayAccount
 * @property {string} name - The name of the gateway account
 * @property {string} id - The id of the gateway account
 * @property {string} type - The type of the gateway account (e.g. test/live)
 * @property {string} description - The description of the gateway account
 * @property {string} analyticsId - Google analyticsId of the gateway account
 * @property {boolean} externalId - external id of the gateway account
 */
class DirectDebitGatewayAccount {
  /**
   * Create an instance of Service
   * @param {Object} gatewayAccountData - raw 'gateway account' object from server
   * @param {string} gatewayAccountData.gateway_account_id - The external ID of the gateway account
   * @param {string} gatewayAccountData.type - The type of the gateway account
   * @param {string} gatewayAccountData.payment_provider - The payment provider of the gateway account
   * @param {string} gatewayAccountData.description - The description of the gateway account
   * @param {string} gatewayAccountData.analytics_id - Google analytics_id of the gateway account
   * @param {boolean} gatewayAccountData.gateway_account_external_id - external id of the gateway account
   **/
  constructor (gatewayAccountData) {
    this.id = gatewayAccountData.gateway_account_id
    this.paymentProvider = gatewayAccountData.payment_provider.toLowerCase()
    this.type = gatewayAccountData.type.toLowerCase()
    this.description = gatewayAccountData.description
    this.analyticsId = gatewayAccountData.analytics_id
    this.externalId = gatewayAccountData.gateway_account_external_id
    this.isConnected = gatewayAccountData.is_connected
    this.paymentMethod = 'direct debit'

    // compatibility with other parts of selfservice - recording as tech debt in jira
    this.payment_provider = gatewayAccountData.payment_provider
  }

  /**
   * @method toJson
   * @returns {Object} A minimal representation of the gateway account
   */
  toMinimalJson () {
    return {
      id: this.id,
      external_id: this.externalId,
      payment_provider: this.paymentProvider,
      type: this.type,
      payment_method: this.paymentMethod
    }
  }
}

module.exports = DirectDebitGatewayAccount
