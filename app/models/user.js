const _ = require('lodash');
let notp = require('notp');
/**
 * @type User
 */
class User {
  constructor(userData) {
    if (!userData) {
      throw Error('Must provide username');
    }
    this._externalId = userData.external_id;
    this._username = userData.username;
    this._email = userData.email || '';
    this._gatewayAccountIds = _.concat([], userData.gateway_account_ids);
    this._serviceIds = userData.service_ids;
    this._otpKey = userData.otp_key || '';
    this._telephoneNumber = userData.telephone_number || '';
    this._disabled = userData.disabled ? userData.disabled : false;
    this._sessionVersion = userData.session_version || 0;
    this._permissions = userData.permissions || [];
    this._role = userData.role || {};
    this._serviceName = userData.service_name;
  }

  toJson() {
    let json = this.toMinimalJson();

    return _.merge(json, {
      disabled: this._disabled,
      session_version: this._sessionVersion,
      permissions: this._permissions,
    });
  }

  toMinimalJson() {
    let json = {
      external_id: this._externalId,
      username: this._username,
      email: this._email,
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
   * @param {String} permissionName name of permission
   */
  hasPermission(permissionName) {
    return this._permissions.indexOf(permissionName) !== -1;
  }

  get externalId() {
    return this._externalId;
  }

  get username() {
    return this._username;
  }

  get sessionVersion() {
    return this._sessionVersion;
  }

  set sessionVersion(value) {
    this._sessionVersion = value;
  }

  get permissions() {
    return this._permissions;
  }

  get email() {
    return this._email;
  }

  get gatewayAccountIds() {
    return this._gatewayAccountIds;
  }

  get serviceIds() {
   return this._serviceIds;
  }

  set gatewayAccountIds(value) {
    this._gatewayAccountIds = value;
  }

  get otpKey() {
    return this._otpKey;
  }

  get telephoneNumber() {
    return this._telephoneNumber;
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
  }

  get role() {
    return this._role;
  }

  get serviceName(){
    return this._serviceName;
  }
}

module.exports.User = User;
