'use strict';



/**
 @class Service
 */
class Service {
  /**
   * Create an instance of Service
   * @param {Object} serviceData - raw 'service' object from server
   * @param {string} serviceData.external_id - The external ID of the service
   * @param {string} serviceData.name - The name of the service
   * @param {string} serviceData.gateway_account_ids - list of gateway account id's that belong to this service
   **/
  constructor(serviceData) {
    this._externalId = serviceData.external_id;
    this._name = serviceData.name;
    this._gatewayAccountIds = serviceData.gateway_account_ids;
  }

  /**
   * @method toJson
   * @returns {Object} An 'adminusers' compatible representation of the service
   */
  toJson() {
    return {
      external_id: this.externalId,
      name: this.name,
      gateway_account_ids: this.gatewayAccountIds
    }
  }

  /**
   * @property {string} externalId - The external ID of the service
   */
  get externalId () {
    return this._externalId;
  }

  /**
   * @property {string} name -  The name of the service
   */
  get name () {
    return this._name;
  }

  /**
   * @property {string[]} gatewayAccountIds -  list of gateway account id's that belong to this service
   */
  get gatewayAccountIds() {
    return this._gatewayAccountIds;
  }
}

module.exports = Service;
