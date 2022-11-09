'use strict'

const logger = require('../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const getAdminUsersClient = require('./clients/adminusers.client')
const ConnectorClient = require('./clients/connector.client').ConnectorClient
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

const adminUsersClient = getAdminUsersClient()

function submitRegistration (email, phoneNumber, password) {
  return adminUsersClient.submitServiceRegistration(email, phoneNumber, password)
}

function submitServiceInviteOtpCode (code, otpCode) {
  return adminUsersClient.verifyOtpForInvite(code, otpCode)
}

async function completeInvite (inviteCode) {
  const completeInviteResponse = await adminUsersClient.completeInvite(inviteCode)

  if (completeInviteResponse.service_external_id) {
    logger.info('Created new service during user registration')

    const gatewayAccount = await connectorClient.createGatewayAccount('sandbox', 'test', null, null, completeInviteResponse.service_external_id)
    logger.info('New test card gateway account registered with service')

    // @TODO(sfount) PP-8438 support existing method of associating services with internal card accounts, this should be
    //               removed once connector integration indexed by services have been migrated
    await adminUsersClient.addGatewayAccountsToService(completeInviteResponse.service_external_id, [gatewayAccount.gateway_account_id])
    logger.info('Service associated with internal gateway account ID with legacy mapping')

    const user = await adminUsersClient.getUserByExternalId(completeInviteResponse.user_external_id)

    // handler called outside of service context, manually include newly created flags for logging
    logger.info('Created new service with test account during user registration', {
      [keys.USER_EXTERNAL_ID]: completeInviteResponse.user_external_id,
      [keys.SERVICE_EXTERNAL_ID]: completeInviteResponse.service_external_id,
      [keys.GATEWAY_ACCOUNT_ID]: gatewayAccount.gateway_account_id,
      internal_user: user.internalUser
    })
  }

  return completeInviteResponse
}

function generateServiceInviteOtpCode (inviteCode) {
  return adminUsersClient.generateInviteOtpCode(inviteCode, null, null)
}

function resendOtpCode (code, phoneNumber) {
  return adminUsersClient.resendOtpCode(code, phoneNumber)
}

module.exports = {
  submitRegistration,
  submitServiceInviteOtpCode,
  completeInvite,
  generateServiceInviteOtpCode,
  resendOtpCode
}
