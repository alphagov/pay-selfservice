'use strict'

const getAdminUsersClient = require('./clients/adminusers_client')

module.exports = {

  /**
   * Submit the user details for new user creation
   *
   * @param code
   * @param telephoneNumber
   * @param password
   * @param correlationId
   * @returns {*|Constructor}
   */
  submitRegistration: function (code, telephoneNumber, password, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).generateInviteOtpCode(code, telephoneNumber, password)
  },

  /**
   * Validates the verification code
   *
   * @param code
   * @param verifyCode
   * @param correlationId
   */
  verifyOtpAndCreateUser: function (code, verifyCode, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).verifyOtpAndCreateUser(code, verifyCode)
  },

  resendOtpCode: function (code, phoneNumber, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).resendOtpCode(code, phoneNumber)
  },

  completeInvite: function (code, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).completeInvite(code)
  }

}
