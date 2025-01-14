'use strict'
const Service = require('./Service.class')

/**
 * @class ServiceRole
 * @property {Service} service - the service that the user is a member of see
 * @property {Object} role - the role the user has on this service
 */
class ServiceRole {
  /**
   * @constructor
   * Create an instance of a ServiceRole
   * @param {Object} serviceRoleData - raw 'serviceRole' object from server
   * @param {Object} serviceRoleData.service - see params for {@link Service.constructor}
   * @param {Object} serviceRoleData.role - raw 'role' object from server
   */
  constructor (serviceRoleData) {
    this.service = new Service(serviceRoleData.service)
    this.role = serviceRoleData.role
  }
}

module.exports = ServiceRole
