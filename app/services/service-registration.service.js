'use strict'

const { keys } = require('@govuk-pay/pay-js-commons').logging

const logger = require('../utils/logger')(__filename)
const getAdminUsersClient = require('./clients/adminusers.client')
const ConnectorClient = require('./clients/connector.client').ConnectorClient
const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)

function submitRegistration (email, phoneNumber, password, correlationId) {
  return getAdminUsersClient({ correlationId }).submitServiceRegistration(email, phoneNumber, password)
}

function submitServiceInviteOtpCode (code, otpCode, correlationId) {
  return getAdminUsersClient({ correlationId }).verifyOtpForServiceInvite(code, otpCode)
}

async function createPopulatedService (inviteCode, correlationId) {
  const adminusersClient = getAdminUsersClient({ correlationId })
  
  const gatewayAccount = await connectorClient().createGatewayAccount('sandbox', 'test', null, null, correlationId)
  const completeInviteResponse = await adminusersClient.completeInvite(inviteCode, [gatewayAccount.gateway_account_id])
  const user = await adminusersClient.getUserByExternalId(completeInviteResponse.user_external_id)

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
  return getAdminUsersClient({ correlationId }).generateInviteOtpCode(inviteCode)
}

function resendOtpCode (code, phoneNumber, correlationId) {
  return getAdminUsersClient({ correlationId }).resendOtpCode(code, phoneNumber)
}

module.exports = {
  submitRegistration,
  submitServiceInviteOtpCode,
  createPopulatedService,
  generateServiceInviteOtpCode,
  resendOtpCode
}
