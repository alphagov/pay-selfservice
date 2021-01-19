'use strict'

const { userServicesContainsGatewayAccount } = require('../../utils/permissions')
const Ledger = require('../../services/clients/ledger.client')
const { renderErrorView } = require('../../utils/response.js')
const router = require('../../routes')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

const defaultMsg = 'Error processing transaction view'
const notFound = 'Charge not found'

module.exports = async function redirectToTransactionDetail (req, res) {
  const chargeId = req.params.chargeId
  
  try {
    const charge = await Ledger.transactionWithAccountOverride(chargeId)
    if (userServicesContainsGatewayAccount(charge.gateway_account_id, req.user)) {
      req.gateway_account.currentGatewayAccountId = charge.gateway_account_id
      req.session = { ...req.session, backLink: req.header('Referer') }

      const account = await connector.getAccount({
        gatewayAccountId: charge.gateway_account_id,
        correlationId: req.correlationId
      })

      res.redirect(302, formatAccountPathsFor(router.paths.account.transactions.detail, account.external_id, chargeId))
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
