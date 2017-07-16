'use strict';

const getAdminUsersClient = require('./clients/adminusers_client');
const paths = require(__dirname + '/../paths.js');

module.exports = {

  /**
   * submit the user details for new user creation
   * @param code
   * @param phoneNumber
   * @param password
   * @param correlationId
   */
  submitRegistration: function (code, phoneNumber, password, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).submitUserRegistration(code,phoneNumber,password);
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
  },

  completeInvite: function (code, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).completeInvite(code);
  }

};
