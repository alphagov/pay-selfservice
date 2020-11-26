'use strict'

const getAdminUsersClient = require('./clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

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
    return adminUsersClient.generateInviteOtpCode(code, telephoneNumber, password, correlationId)
  },

  /**
   * Validates the verification code
   *
   * @param code
   * @param verifyCode
   * @param correlationId
   */
  verifyOtpAndCreateUser: function (code, verifyCode, correlationId) {
    return adminUsersClient.verifyOtpAndCreateUser(code, verifyCode, correlationId)
  },

  resendOtpCode: function (code, phoneNumber, correlationId) {
    return adminUsersClient.resendOtpCode(code, phoneNumber, correlationId)
  },

  completeInvite: function (code, correlationId) {
    return adminUsersClient.completeInvite(code, correlationId)
  }

}
