'use strict';
const Service = require('./Service.class');

/**
 @class ServiceRole
 */
class ServiceRole {

  /**
   * Create an instance of a ServiceRole
   * @param {Object} serviceRoleData - raw 'serviceRole' object from server
   */
  constructor(serviceRoleData) {
    this._service = new Service(serviceRoleData.service);
    this._role = serviceRoleData.role;
  }


  /**
   *
   * @returns {Service}
   */
  get service() {
    return this._service;
  }

  /**
   *
   * @returns {Object} role structure from adminusers
   */
  get role() {
    return this._role;
  }
}

module.exports = ServiceRole;
