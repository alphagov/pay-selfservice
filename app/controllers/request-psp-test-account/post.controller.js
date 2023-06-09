'use strict'

const { response } = require('../../utils/response')
const zendeskClient = require('../../services/clients/zendesk.client')
const getAdminUsersClient = require('../../services/clients/adminusers.client')
const logger = require('../../utils/logger')(__filename)
const { CREATED, NOT_STARTED, REQUEST_SUBMITTED } = require('../../models/psp-test-account-stage')
const adminUsersClient = getAdminUsersClient()

async function submitRequestAndUpdatePspTestAccountStatus (req) {
  const message = `Service name: ${req.service.name}
    Service ID: ${req.service.externalId}
    PSP: 'Stripe'
    Email address: ${req.user.email}
    Time: ${new Date().toISOString()}
    Service created at: ${req.service.createdDate || '(service was created before we captured this date)'}`

  const zendeskOpts = {
    email: req.user.email,
    name: req.user.username,
    type: 'task',
    subject: `Request for Stripe test account from service (${req.service.name})`,
    tags: ['govuk_pay_support'],
    message
  }

  await zendeskClient.createTicket(zendeskOpts)
  await adminUsersClient.updatePspTestAccountStage(req.service.externalId, REQUEST_SUBMITTED)
  logger.info('Request submitted for Stripe test account')
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
