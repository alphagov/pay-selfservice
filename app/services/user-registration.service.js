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
   * @returns {*|Constructor}
   */
  submitRegistration: function submitRegistration (code, telephoneNumber, password) {
    return adminUsersClient.generateInviteOtpCode(code, telephoneNumber, password)
  },

  verifyOtp: function verifyOtp (inviteCode, verifyCode) {
    return adminUsersClient.verifyOtpForInvite(inviteCode, verifyCode)
  },

  resendOtpCode: function resendOtpCode (code, phoneNumber) {
    return adminUsersClient.resendOtpCode(code, phoneNumber)
  },

  completeInvite: function completeInvite (code) {
    return adminUsersClient.completeInvite(code)
  }

}
