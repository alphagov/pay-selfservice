const _ = require('lodash');
var notp = require('notp');
/**
 * @type User
 */
class User {
  constructor(userData) {
    if (!userData) {
      throw Error('Must provide username');
    }
    this._username = userData.username;
    this._email = userData.email || '';
    this._gatewayAccountId = userData.gateway_account_id ? String(userData.gateway_account_id) : '';
    this._otpKey = userData.otp_key || '';
    this._telephoneNumber = userData.telephone_number || '';
    this._disabled = userData._disabled ? userData._disabled : false;
    this._loginCounter = userData.login_counter || 0;
    this._sessionVersion = userData.session_version || 0;
    this._permissions = userData.permissions || [];
    this._role = userData.role || {};
  }

  toJson() {
    let json = this.toMinimalJson();

    return _.merge(json, {
      disabled: this._disabled,
      login_counter: this._loginCounter,
      session_version: this._sessionVersion,
      permissions: this._permissions,
    });
  }

  toMinimalJson() {
    let json = {
      username: this._username,
      email: this._email,
      gateway_account_id: this._gatewayAccountId,
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
   * @returns {String}
   */
  generateOTP() {
    return notp.totp.gen(this._otpKey);
  }

  /**
   * @param {String} permissionName name of permission
   */
  hasPermission(permissionName) {
    return this._permissions.indexOf(permissionName) !== -1;
  }

  get username() {
    return this._username;
  }

  get loginCounter() {
    return this._loginCounter;
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

  get gatewayAccountId() {
    return this._gatewayAccountId;
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

  get role() {
    return this._role;
  }

}

module.exports.User = User;
