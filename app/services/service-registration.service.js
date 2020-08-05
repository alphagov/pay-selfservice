'use strict'

const logger = require('../utils/logger')(__filename)
const getAdminUsersClient = require('./clients/adminusers.client')
const ConnectorClient = require('./clients/connector.client').ConnectorClient
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)

const completeServiceInvite = (inviteCode, gatewayAccountIds, correlationId) => {
  return getAdminUsersClient({ correlationId }).completeInvite(inviteCode, gatewayAccountIds)
}

const createGatewayAccount = function (correlationId) {
  return connectorClient().createGatewayAccount('sandbox', 'test', null, null, correlationId)
}

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
    return getAdminUsersClient({ correlationId }).submitServiceRegistration(email, phoneNumber, password)
  },

  /**
   * Submit otp code for verification
   *
   * @param code
   * @param otpCode
   * @param correlationId
   */
  submitServiceInviteOtpCode: (code, otpCode, correlationId) => {
    return getAdminUsersClient({ correlationId }).verifyOtpForServiceInvite(code, otpCode)
  },

  /**
   * Creates a service containing a sandbox gateway account and a user
   */
  createPopulatedService: (inviteCode, correlationId) => {
    return new Promise(function (resolve, reject) {
      let gatewayAccountId
      createGatewayAccount(correlationId)
        .then(gatewayAccount => {
          gatewayAccountId = gatewayAccount.gateway_account_id
          return completeServiceInvite(inviteCode, [gatewayAccountId], correlationId)
        })
        .then(completeServiceInviteResponse => {
          resolve(completeServiceInviteResponse)
        })
        .catch(error => {
          logger.error(`[requestId=${correlationId}] Create populated service orchestration error`, error)
          reject(error)
        })
    })
  },

  /**
   * Generate OTP code for service invite
   *
   * @param inviteCode
   * @param correlationId
   * @returns {*|Constructor}
   */
  generateServiceInviteOtpCode: function (inviteCode, correlationId) {
    return getAdminUsersClient({ correlationId }).generateInviteOtpCode(inviteCode)
  },

  /**
   * Resend otp code
   *
   * @param code
   * @param phoneNumber
   * @param correlationId
   */
  resendOtpCode: function (code, phoneNumber, correlationId) {
    return getAdminUsersClient({ correlationId }).resendOtpCode(code, phoneNumber)
  }
}
