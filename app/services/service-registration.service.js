'use strict'

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
  const gatewayAccount = await connectorClient().createGatewayAccount('sandbox', 'test', null, null, correlationId)
  return getAdminUsersClient({ correlationId }).completeInvite(inviteCode, [gatewayAccount.gateway_account_id])
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
