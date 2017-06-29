'use strict';

/**
 * @class GatewayAccount
 */
class GatewayAccount {

  /**
   * Create an instance of Service
   * @param {Object} gatewayAccountData - raw 'gateway account' object from server
   * @param {string} gatewayAccountData.gateway_account_id - The external ID of the gateway account
   * @param {string} gatewayAccountData.service_name - The name of the gateway account
   * @param {string} gatewayAccountData.type - The type of the gateway account
   * @param {string} gatewayAccountData.description - The description of the gateway account
   * @param {string} gatewayAccountData.analytics_id - Google analytics_id of the gateway account
   * @param {boolean} gatewayAccountData.toggle_3ds - whether 3DS is enabled or not on this gateway account
   **/
  constructor(gatewayAccountData) {
    this._id = gatewayAccountData.gateway_account_id;
    this._name = gatewayAccountData.service_name;
    this._type = gatewayAccountData.type;
    this._description = gatewayAccountData.description;
    this._analyticsId = gatewayAccountData.analytics_id;
    this._toggle3ds = gatewayAccountData.toggle_3ds;
  }

  /**
   * @method toJson
   * @returns {Object} A minimal representation of the gateway account
   */
  toMinimalJson() {
    return {
      id: this.id,
      service_name: this.name,
      type: this.type
    }
  }

  /**
   * @property {string} name - The name of the gateway account
   */
  get name () {
    return this._name
  }

  /**
   * @property {string} id - The id of the gateway account
   */
  get id () {
    return this._id
  }

  /**
   * @property {string} type - The type of the gateway account (e.g. test/live)
   */
  get type() {
    return this._type;
  }

  /**
   * @property {string} description - The description of the gateway account
   */
  get description() {
    return this._description;
  }

  /**
   * @property {string} analyticsId - Google analyticsId of the gateway account
   */
  get analyticsId() {
    return this._analyticsId;
  }

  /**
   * @property {boolean} toggle3ds - whether 3DS is enabled or not on this gateway account
   */
  get toggle3ds() {
    return this._toggle3ds;
  }
}

module.exports = GatewayAccount;
