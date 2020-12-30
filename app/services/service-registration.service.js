'use strict'

const { keys } = require('@govuk-pay/pay-js-commons').logging

const logger = require('../utils/logger')(__filename)
const getAdminUsersClient = require('./clients/adminusers.client')
const ConnectorClient = require('./clients/connector.client').ConnectorClient
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

const adminUsersClient = getAdminUsersClient()

function submitRegistration (email, phoneNumber, password, correlationId) {
  return adminUsersClient.submitServiceRegistration(email, phoneNumber, password, correlationId)
}

function submitServiceInviteOtpCode (code, otpCode, correlationId) {
  return adminUsersClient.verifyOtpForServiceInvite(code, otpCode, correlationId)
}

async function createPopulatedService (inviteCode, correlationId) {
  const gatewayAccount = await connectorClient.createGatewayAccount('sandbox', 'test', null, null, correlationId)
  const completeInviteResponse = await adminUsersClient.completeInvite(correlationId, inviteCode, [gatewayAccount.gateway_account_id])
  const user = await adminUsersClient.getUserByExternalId(completeInviteResponse.user_external_id, correlationId)

  const logContext = {
    internal_user: user.internalUser
  }
  logContext[keys.USER_EXTERNAL_ID] = user.externalId
  logContext[keys.SERVICE_EXTERNAL_ID] = completeInviteResponse.service_external_id
  logContext[keys.GATEWAY_ACCOUNT_ID] = gatewayAccount.gateway_account_id
  logger.info('Created new service with test account during user registration', logContext)

  return user
}

function generateServiceInviteOtpCode (inviteCode, correlationId) {
  return adminUsersClient.generateInviteOtpCode(inviteCode, null, null, correlationId)
}

function resendOtpCode (code, phoneNumber, correlationId) {
  return adminUsersClient.resendOtpCode(code, phoneNumber, correlationId)
}

module.exports = {
  submitRegistration,
  submitServiceInviteOtpCode,
  createPopulatedService,
  generateServiceInviteOtpCode,
  resendOtpCode
}
