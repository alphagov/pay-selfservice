let getAdminUsersClient = require('./clients/adminusers_client');
let paths = require(__dirname + '/../paths.js');

module.exports = {

  /**
   * gets the invite identified by `code`. Assumes its validates (i.e. not expired)
   * @param code
   * @param correlationId
   */
  getValidatedInvite: function (code, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).getValidatedInvite(code);
  },

  /**
   * submit the user details for new user creation
   * @param code
   * @param phoneNumber
   * @param password
   * @param correlationId
   */
  submitRegistration: function (code, phoneNumber, password, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).submitRegistration(code,phoneNumber,password);
  },

  /**
   * validates the verification code
   * @param code
   * @param verifyCode
   * @param correlationId
   */
  verifyOtpAndCreateUser: function (code, verifyCode, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).verifyOtpAndCreateUser(code, verifyCode);
  },

  resendOtpCode: function (code, phoneNumber, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).resendOtpCode(code, phoneNumber);
  }
};
