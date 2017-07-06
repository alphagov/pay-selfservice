'use strict'

// Custom dependencies
const getAdminUsersClient = require('./clients/adminusers_client')
const paths = require(__dirname + '/../paths')

module.exports = {

  /**
   * Submit the user details for self registration of a service
   *
   * @param email
   * @param phoneNumber
   * @param password
   * @param correlationId
   */
  submitRegistration: function (email, phoneNumber, password, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).submitServiceRegistration(email, phoneNumber, password)
  },

  /**
   * Submit otp code for verification
   *
   * @param code
   * @param otpCode
   * @param correlationId
   */
  submitServiceInviteOtpCode: function (code, otpCode, correlationId) {
    return getAdminUsersClient({correlationId}).verifyOtpForServiceInvite(code, otpCode)
  },

  /**
   * Resend otp code
   *
   * @param code
   * @param phoneNumber
   * @param correlationId
   */
  resendOtpCode: function (code, phoneNumber, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).resendOtpCode(code, phoneNumber)
  }
}
