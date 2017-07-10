'use strict';

/**
 * @class GatewayAccount
 * @property {string} name - The name of the gateway account
 * @property {string} id - The id of the gateway account
 * @property {string} type - The type of the gateway account (e.g. test/live)
 * @property {string} description - The description of the gateway account
 * @property {string} analyticsId - Google analyticsId of the gateway account
 * @property {boolean} toggle3ds - whether 3DS is enabled or not on this gateway account
 */
class GatewayAccount {

  /**
   * Create an instance of Service
   * @param {Object} gatewayAccountData - raw 'gateway account' object from server
   * @param {string} gatewayAccountData.gateway_account_id - The external ID of the gateway account
   * @param {string} gatewayAccountData.service_name - The name of the gateway account
   * @param {string} gatewayAccountData.type - The type of the gateway account
   * @param {string} gatewayAccountData.payment_provider - The payment provider of the gateway account
   * @param {string} gatewayAccountData.description - The description of the gateway account
   * @param {string} gatewayAccountData.analytics_id - Google analytics_id of the gateway account
   * @param {boolean} gatewayAccountData.toggle_3ds - whether 3DS is enabled or not on this gateway account
   **/
  constructor(gatewayAccountData) {
    this.id = gatewayAccountData.gateway_account_id;
    this.name = gatewayAccountData.service_name;
    this.type = gatewayAccountData.type;
    this.paymentProvider = gatewayAccountData.payment_provider;
    this.description = gatewayAccountData.description;
    this.analyticsId = gatewayAccountData.analytics_id;
    this.toggle3ds = gatewayAccountData.toggle_3ds;
  }

  /**
   * @method toJson
   * @returns {Object} A minimal representation of the gateway account
   */
  toMinimalJson() {
    return {
      id: this.id,
      payment_provider: this.paymentProvider,
      service_name: this.name,
      type: this.type
    }
  }
}

module.exports = GatewayAccount;
