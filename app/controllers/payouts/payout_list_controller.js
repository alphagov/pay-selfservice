const { response, renderErrorView } = require('../../utils/response.js')
const { liveUserServicesGatewayAccounts } = require('./../../utils/valid_account_id')
const payoutService = require('./payouts_service')
const Paginator = require('../../utils/paginator')

const listAllServicesPayouts = async function listAllServicesPayouts (req, res) {
  try {
    const gatewayAccounts = await liveUserServicesGatewayAccounts(req.user)
    const payoutGroups = await payoutService.payouts(gatewayAccounts.accounts, req.user)

    const PAGE_SIZE = 20
    const paginator = new Paginator(10, PAGE_SIZE, 1)
    const paginationLinks = paginator.getLast() > 1 ? paginator.getNamedCentredRange(2, true, true) : null

    response(req, res, 'payouts/list', { payoutGroups, paginationLinks })
  } catch (error) {
    renderErrorView(req, res, 'Failed to fetch payouts')
  }
}

module.exports = {
  listAllServicesPayouts
}
