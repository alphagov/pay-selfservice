'use strict'

// NPM dependencies
const q = require('q')
const logger = require('winston')

// Custom dependencies
const getAdminUsersClient = require('./clients/adminusers_client')
const ConnectorClient = require('../services/clients/connector_client').ConnectorClient
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
const paths = require('../paths')
const userService = require('./user_service')

const submitCreateService = function (gatewayAccountIds, correlationId) {
  return getAdminUsersClient({correlationId}).createService(null, gatewayAccountIds)
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
   * Creates a service containing a sandbox gateway account and a user
   */
  createPopulatedService: (userData, correlationId) => {
    const defer = q.defer()

    let gatewayAccountId
    createGatewayAccount(correlationId)
      .then(gatewayAccount => {
        gatewayAccountId = gatewayAccount.gateway_account_id
        return submitCreateService([gatewayAccountId], correlationId)
      })
      .then(service => {
        return userService.createUser(userData.email, [gatewayAccountId], [service.externalId], userData.role, userData.phoneNumber, correlationId)
      })
      .then(user => {
        defer.resolve(user)
      })
      .catch(error => {
        logger.error(`[requestId=${correlationId}] Create populated service orchestration error -`, error)
        defer.reject(error)
      })

    return defer.promise
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
  },

  /**
   * Update service name
   *
   * @param serviceId
   * @param serviceName
   * @param correlationId
   */
  updateServiceName: function (serviceId, serviceName, correlationId) {
    return getAdminUsersClient({correlationId: correlationId}).updateServiceName(serviceId, serviceName)
  }
}
