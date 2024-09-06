'use strict'

const { response } = require('../../utils/response')
const getAdminUsersClient = require('../../services/clients/adminusers.client')
const publicAuthClient = require('../../services/clients/public-auth.client')
const { ConnectorClient } = require('../../services/clients/connector.client')
const logger = require('../../utils/logger')(__filename)
const { CREATED, NOT_STARTED, REQUEST_SUBMITTED } = require('../../models/psp-test-account-stage')
const adminUsersClient = getAdminUsersClient()
const { CONNECTOR_URL } = process.env
const connectorClient = new ConnectorClient(CONNECTOR_URL)

async function submitRequestAndUpdatePspTestAccountStatus (req) {
  const ids = await connectorClient.requestStripeTestAccount(req.service.externalId)
  logger.info(`Stripe connect account ${ids.stripe_connect_account_id} and gateway account with id ${ids.gateway_account_id}
  and external id ${ids.gateway_account_external_id} was created for service ${req.service.external_id}.`)
  await adminUsersClient.addGatewayAccountsToService(req.service.externalId, [ ids.gateway_account_id ])
  await adminUsersClient.updatePspTestAccountStage(req.service.externalId, CREATED)
  return ids.gateway_account_external_id
}

module.exports = async function submitRequestForPspTestAccount (req, res, next) {
  const service = req.service
  if (!(service.currentPspTestAccountStage === NOT_STARTED || !service.currentPspTestAccountStage)) {
    const pageData = {
      requestForPspTestAccountSubmitted: (service.currentPspTestAccountStage === REQUEST_SUBMITTED),
      pspTestAccountCreated: (service.currentPspTestAccountStage === CREATED)
    }
    logger.info('Request for stripe test account cannot be submitted',
      { current_psp_test_account_stage: service.currentPspTestAccountStage })

    return response(req, res, 'request-psp-test-account/index', pageData)
  }

  const gatewayAccount = await connectorClient.getAccountByServiceIdAndAccountType({ serviceId: service.externalId, accountType: 'test' })
  if (!(gatewayAccount.payment_provider === 'sandbox')) {
    throw new Error('Existing test account must be a sandbox one in order to request a Stripe test account.')
  }

  const sandboxGatewayAccountId = gatewayAccount.gateway_account_id
  const gatewayAccountExternalId = await submitRequestAndUpdatePspTestAccountStatus(req)

  try {
    await publicAuthClient.revokeTokensForAccount(sandboxGatewayAccountId)
  } catch (error) {
    logger.error(`There was an error revoking tokens for sandbox account with id ${sandboxGatewayAccountId}. ${error}`)
  }

  req.flash('requestStripeTestAccount', 'success')
  res.redirect(`/account/${gatewayAccountExternalId}/dashboard`)
}
