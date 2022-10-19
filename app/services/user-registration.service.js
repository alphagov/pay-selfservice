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

  verifyOtp: function (inviteCode, verifyCode, correlationId) {
    return adminUsersClient.verifyOtpForInvite(inviteCode, verifyCode, correlationId)
  },

  resendOtpCode: function (code, phoneNumber, correlationId) {
    return adminUsersClient.resendOtpCode(code, phoneNumber, correlationId)
  },

  completeInvite: function (code, correlationId) {
    return adminUsersClient.completeInvite(correlationId, code)
  }

}
