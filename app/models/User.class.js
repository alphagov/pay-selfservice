'use strict'

// NPM dependencies
const _ = require('lodash')

// Local dependencies
const ServiceRole = require('./ServiceRole.class')
const AdminServiceRole = require('./AdminServiceRole.class')

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
 * @property {ServiceRole[]} adminServiceRoles - An array of serviceRoles a platform admin has access to, other than their own

 *
 */
class User {
  /**
   * @constructor Create an instance of User
   * @param {Object} userData - raw 'user' object from server
   * @param {string} userData.external_id - The user's external ID
   * @param {string} userData.is_platform_admin - Whether the user is a platform admin
   * @param {string} userData.username - The user's username
   * @param {string} userData.email - The user's email address
   * @param {string} userData.otp_key - The user's OTP key
   * @param {string} userData.telephone_number - The user's telephone number
   * @param {boolean} userData.disabled - Whether or not the user's account is locked
   * @param {number} userData.session_version - The user's current session version
   * @param {Object[]} userData.service_roles - An array of the user's serviceRoles
   * @param {Object} userData.admin_service_roles - (For a platform admin) An array of all services the user is not directly a member of with their top level role
   * @param {Object} userData.service_roles[].service - A raw service object see {@link Service.constructor}
   * @param {Object} userData.service_roles[].role - A raw role object
   * @param {String[]} userData.features - An array of the user's active feature flags
   **/
  constructor (userData) {
    if (!userData) {
      throw Error('Must provide username')
    }

    const adminServiceRole = (userData.admin_service_roles || {})

    this.externalId = userData.external_id
    this.isPlatformAdmin = userData.is_platform_admin || false
    this.username = userData.username
    this.email = userData.email || ''
    this.serviceRoles = userData.service_roles.map(serviceRoleData => new ServiceRole(serviceRoleData))
    this.adminServiceRoles = !userData.is_platform_admin ? {} : {
      services: (adminServiceRole.services || []).map(service => new AdminServiceRole({service, role: null})),
      role: adminServiceRole.role
    }
    this.otpKey = userData.otp_key || ''
    this.telephoneNumber = userData.telephone_number || ''
    this.disabled = userData.disabled ? userData.disabled : false
    this.sessionVersion = userData.session_version || 0
    this.features = (userData.features || '').split(',').map(feature => feature.trim())
    this.secondFactor = userData.second_factor
    this.provisionalOtpKey = userData.provisional_otp_key || ''
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
      telephone_number: this.telephoneNumber,
      provisional_otp_key: this.provisionalOtpKey,
      second_factor: this.secondFactor

    }

    if (this.otpKey) {
      json.otp_key = this.otpKey
    }
    return json
  }

  hasFeature (featureName) {
    return this.features.includes(featureName)
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
   * @method hasAdminPermission
   * @param {String} permissionName name of permission
   * @returns {boolean} Whether or not the admin user has the given permission
   */
  hasAdminPermission (permissionName) {
    return !this.isPlatformAdmin ? false : this.adminServiceRoles.role.permissions
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
