'use strict'
const Service = require('./Service.class')

/**
 * @class ServiceRole
 * @property {Service} service - the service that the user is a member of see
 * @property {Object} role - the role the user has on this service
 */
class AdminServiceRole {
  /**
   * @constructor
   * Create an instance of a ServiceRole
   * @param {Object} serviceRoleData - raw 'serviceRole' object from server
   * @param {Object} serviceRoleData.service - see params for {@link Service.constructor}
   */
  constructor (serviceRoleData) {
    this.service = new Service(serviceRoleData.service)
  }
}

module.exports = AdminServiceRole
