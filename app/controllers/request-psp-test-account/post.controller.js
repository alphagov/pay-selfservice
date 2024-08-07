'use strict'

const { response } = require('../../utils/response')
const getAdminUsersClient = require('../../services/clients/adminusers.client')
// const getPublicAuthClient = require('../../services/clients/public-auth.client.client')
const getConnectorClient = require('../../services/clients/connector.client')
const logger = require('../../utils/logger')(__filename)
const { CREATED, NOT_STARTED, REQUEST_SUBMITTED } = require('../../models/psp-test-account-stage')
const adminUsersClient = getAdminUsersClient()
const connectorClient = getConnectorClient()
// const publicAuthClient = getPublicAuthClient()

async function submitRequestAndUpdatePspTestAccountStatus (req) {
  const ids = await connectorClient.requestStripeTestAccount(req.service.externalId)
  logger.info(`Stripe connect account ${ids.stripe_connect_account_id} was created`)
  logger.info(`Gateway account with id ${ids.gateway_account_id} and external id ${ids.gateway_account_external_id} was created in connector`)
  await adminUsersClient.updatePspTestAccountStage(req.service.externalId, CREATED)
  logger.info('Request submitted for Stripe test account')
  // await publicAuthClient.revokeTokensForAccount()
}

module.exports = async function submitRequestForPspTestAccount (req, res, next) {
  const service = req.service
  try {
    const pageData = {}

    if (service.currentPspTestAccountStage === NOT_STARTED || !service.currentPspTestAccountStage) {
      await submitRequestAndUpdatePspTestAccountStatus(req)
      pageData.pspTestAccountRequestSubmitted = true
    } else {
      pageData.requestForPspTestAccountSubmitted = (service.currentPspTestAccountStage === REQUEST_SUBMITTED)
      pageData.pspTestAccountCreated = (service.currentPspTestAccountStage === CREATED)
      logger.info('Request for stripe test account cannot be submitted',
        { current_psp_test_account_stage: service.currentPspTestAccountStage })
    }

    return response(req, res, 'request-psp-test-account/index', pageData)
  } catch (error) {
    return next(error)
  }
}
