'use strict';

const _ = require('lodash');
const Service = require('./Service.class')
const ServiceRole = require('./ServiceRole.class')
const notp = require('notp');

/**
 * @class User
 */
class User {
  /**
   * Create an instance of User
   * @param {Object} userData - raw 'user' object from server
   * @param {string} userData.external_id - The user's external ID
   * @param {string} userData.username - The user's username
   * @param {string} userData.email - The user's email address
   * @param {string[]} userData.gateway_account_ids - DEPRECATED - The IDs of all the gateway account's the user is a member of
   * @param {Object[]} userData.services - An array of 'services' which the user is a member of
   * @param {string} userData.services[].external_id - The external ID of the service
   * @param {string} userData.services[].name - The name of the service
   * @param {string[]} userData.serviceIds - DEPRECATED - A list of the user's gateway IDs
   * @param {string} userData.otp_key - The user's OTP key
   * @param {string} userData.telephone_number - The user's telephone number
   * @param {boolean} userData.disabled - Whether or not the user's account is locked
   * @param {number} userData.session_version - The user's current session version
   * @param {string[]} userData.permissions - A list of the user's permissions
   * @param {Object} userData.role - The user's role
   **/
  constructor(userData) {
    if (!userData) {
      throw Error('Must provide username');
    }
    this._externalId = userData.external_id;
    this._username = userData.username;
    this._email = userData.email || '';
    this._gatewayAccountIds = _.concat([], userData.gateway_account_ids);
    this._serviceRoles = userData.service_roles.map(serviceRoleData => new ServiceRole(serviceRoleData));
    //TODO: fix to only use serviceRoles
    this._services = this._serviceRoles.map(serviceRole => serviceRole.service);
    //TODO: fix to use serviceRoles
    this._serviceIds = this._services.map(service => service.externalId);
    this._otpKey = userData.otp_key || '';
    this._telephoneNumber = userData.telephone_number || '';
    this._disabled = userData.disabled ? userData.disabled : false;
    this._sessionVersion = userData.session_version || 0;
    this._permissions = userData.permissions || [];
    this._role = userData.role || {};
  }

  /**
   * @method toJson
   * @returns an 'adminusers' compatible representation of the user object
   **/
  toJson() {
    let json = this.toMinimalJson();

    return _.merge(json, {
      disabled: this._disabled,
      session_version: this._sessionVersion,
      permissions: this._permissions,
    });
  }

  /**
   * @method toJson
   * @returns an minimal 'adminusers' compatible representation of the user object
   **/
  toMinimalJson() {
    let json = {
      external_id: this._externalId,
      username: this._username,
      email: this._email,
      services: this._services.map(service => service.toJson()),
      gateway_account_ids: this._gatewayAccountIds,
      service_ids: this._serviceIds,
      telephone_number: this._telephoneNumber,
      /**
       * As of now, we expect these JSON representations are only used for data transfer between AdminUsers.
       * AdminUsers does not require the "role.description" (ever) as it is set directly from migration scripts.
       * Hence we are flattening the role object just to "role_name" here.
       */
      role_name: this._role.name
    };

    if (this._otpKey) {
      json.otp_key = this._otpKey;
    }
    return json;
  }

  /**
   * @method hasPermission
   * @param {String} permissionName name of permission
   * @returns {boolean} Whether or not the user has the given permission
   */
  hasPermission(permissionName) {
    return _.flatten(this._serviceRoles.map(serviceRole => serviceRole.role.permissions)).includes(permissionName);
  }

  getRoleForService(externalServiceId) {
    const serviceRole = this._serviceRoles.find(serviceRole => serviceRole.service.externalId === externalServiceId);
    return _.get(serviceRole, 'role');
  }
  /**
   * @method hasService
   * @param externalServiceId
   * @returns {boolean}
   */
  hasService(externalServiceId) {
    return this._serviceRoles.map(serviceRole => serviceRole.service.externalId).includes(externalServiceId)
  }

  /**
   * @property {number} externalId - The user's external ID
   */
  get externalId() {
    return this._externalId;
  }

  /**
   * @property {number} username - The user's username
   */
  get username() {
    return this._username;
  }

  /**
   * @property {number} sessionVersion - The user's current session version
   */
  get sessionVersion() {
    return this._sessionVersion;
  }

  set sessionVersion(value) {
    this._sessionVersion = value;
  }

  /**
   * @property {string[]} permissions - A list of the user's permissions
   */
  get permissions() {
    return this._permissions;
  }

  /**
   * @property {number} email - The user's email
   */
  get email() {
    return this._email;
  }

  /**
   * @property {string[]} gatewayAccountIds - A list of the user's gateway account IDs
   * x@deprecated
   */
  get gatewayAccountIds() {
    return this._gatewayAccountIds;
  }

  set gatewayAccountIds(value) {
    this._gatewayAccountIds = value;
  }


  /**
   * @property {Service[]} services - A list of the user's services
   * @deprecated
   */
  get services() {
    return this._serviceRoles.map(serviceRole => serviceRole.service);
  }

  /**
   * @property {string[]} serviceIds - A list of the user's service IDs
   * @deprecated
   */
  get serviceIds() {
    return this._serviceIds;
  }

  /**
   * @property {string} otpKey - The user's OTP key
   */
  get otpKey() {
    return this._otpKey;
  }

  /**
   * @property {string} telephoneNumber - The user's telephone number
   */
  get telephoneNumber() {
    return this._telephoneNumber;
  }

  /**
   * @property {boolean} disabled - Whether or not the user is disabled
   */
  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
  }

  /**
   * @property {Object} role - The user's role
   */
  get role() {
    return this._role;
  }


  /**
   *
   * @property {ServiceRole[]}
   */
  get serviceRoles() {
    return this._serviceRoles;
  }
}

module.exports = User;
