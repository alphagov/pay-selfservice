const paths = require('../../../app/paths')
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging
const { response, renderErrorView } = require('../../utils/response.js')
const { liveUserServicesGatewayAccounts } = require('../../utils/permissions')
const payoutService = require('./payouts_service')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  try {
    const { page } = req.query
    const gatewayAccounts = await liveUserServicesGatewayAccounts(req.user)
    const payoutSearchResult = await payoutService.payouts(gatewayAccounts.accounts, req.user, page)
    const logContext = {
      gateway_accounts: gatewayAccounts,
      current_page: page
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.GATEWAY_ACCOUNT] = gatewayAccounts
    logger.info('Fetched page of payouts for all services', logContext)
    response(req, res, 'payouts/list', { payoutSearchResult, paths })
  } catch (error) {
    renderErrorView(req, res, 'Failed to fetch payouts')
  }
}

module.exports = {
  listAllServicesPayouts
}
