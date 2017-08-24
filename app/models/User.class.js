'use strict'

const _ = require('lodash')
const ServiceRole = require('./ServiceRole.class')

/**
 * @class User
 * @description An instance of a user
 * @property {String} externalId - The user's external ID
 * @property {String} username - The user's username
 * @property {String} email - The user's email
 * @property {number} sessionVersion - The user's current session version
 * @property {string} otpKey - The user's OTP key
 * @property {string} telephoneNumber - The user's telephone number
 * @property {boolean} disabled - Whether or not the user is disabled
 * @property {ServiceRole[]} serviceRoles - An array of the user's serviceRoles
 *
 */
class User {
  /**
   * @constructor Create an instance of User
   * @param {Object} userData - raw 'user' object from server
   * @param {string} userData.external_id - The user's external ID
   * @param {string} userData.username - The user's username
   * @param {string} userData.email - The user's email address
   * @param {string} userData.otp_key - The user's OTP key
   * @param {string} userData.telephone_number - The user's telephone number
   * @param {boolean} userData.disabled - Whether or not the user's account is locked
   * @param {number} userData.session_version - The user's current session version
   * @param {Object[]} userData.service_roles - An array of the user's serviceRoles
   * @param {Object} userData.service_roles[].service - A raw service object see {@link Service.constructor}
   * @param {Object} userData.service_roles[].role - A raw role object
   * @param {String[]} userData.features - An array of the user's active feature flags
   **/
  constructor (userData) {
    if (!userData) {
      throw Error('Must provide username')
    }
    this.externalId = userData.external_id
    this.username = userData.username
    this.email = userData.email || ''
    this.serviceRoles = userData.service_roles.map(serviceRoleData => new ServiceRole(serviceRoleData))
    this.otpKey = userData.otp_key || ''
    this.telephoneNumber = userData.telephone_number || ''
    this.disabled = userData.disabled ? userData.disabled : false
    this.sessionVersion = userData.session_version || 0
    this.features = (userData.features || '').split(',')
  }

  /**
   * @method toJson
   * @returns an 'adminusers' compatible representation of the user object
   **/
  toJson () {
    let json = this.toMinimalJson()

    return _.merge(json, {
      disabled: this.disabled,
      session_version: this.sessionVersion
    })
  }

  /**
   * @method toJson
   * @returns an minimal 'adminusers' compatible representation of the user object
   **/
  toMinimalJson () {
    let json = {
      external_id: this.externalId,
      username: this.username,
      email: this.email,
      gateway_account_ids: this.gatewayAccountIds,
      telephone_number: this.telephoneNumber
    }

    if (this.otpKey) {
      json.otp_key = this.otpKey
    }
    return json
  }

  /**
   * @method hasPermission
   * @param {String} permissionName name of permission
   * @returns {boolean} Whether or not the user has the given permission
   */
  hasPermission (serviceExternalId, permissionName) {
    return _.get(this.getRoleForService(serviceExternalId), 'permissions', [])
      .map(permission => permission.name)
      .includes(permissionName)
  }

  /**
   * @method getRoleForService
   * @param externalServiceId
   * @return {Object | undefined} Either the user's role in the service or undefined if they have no role
   */
  getRoleForService (externalServiceId) {
    const serviceRole = this.serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId)
    return _.get(serviceRole, 'role')
  }

  /**
   * @method hasService
   * @param externalServiceId
   * @returns {boolean}
   */
  hasService (externalServiceId) {
    return this.serviceRoles.map(serviceRole => serviceRole.service.externalId).includes(externalServiceId)
  }

  /**
   * @method getPermissionsForService
   * @param serviceExternalId
   * @returns {String[]} permission names for the given serviceId
   */
  getPermissionsForService (serviceExternalId) {
    return _.get(this.getRoleForService(serviceExternalId), 'permissions', []).map(permission => permission.name)
  }
}

module.exports = User
