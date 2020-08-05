'use strict'

const paths = require('../../paths')
const { userServicesContainsGatewayAccount } = require('../../utils/permissions')
const Ledger = require('../../services/clients/ledger.client')
const { renderErrorView } = require('../../utils/response.js')
const router = require('../../routes')

const defaultMsg = 'Error processing transaction view'
const notFound = 'Charge not found'

module.exports = async (req, res) => {
  const chargeId = req.params.chargeId
  try {
    let charge = await Ledger.transactionWithAccountOverride(chargeId)
    if (userServicesContainsGatewayAccount(charge.gateway_account_id, req.user)) {
      req.gateway_account.currentGatewayAccountId = charge.gateway_account_id
      req.session = { ...req.session, backLink: req.header('Referer') }
      charge = null
      res.redirect(302, router.generateRoute(paths.transactions.detail, { chargeId }))
    } else {
      renderErrorView(req, res, notFound, 404)
    }
  } catch (err) {
    if (err === 'NOT_FOUND') {
      renderErrorView(req, res, notFound, 404)
    } else {
      renderErrorView(req, res, defaultMsg, 500)
    }
  }
}
