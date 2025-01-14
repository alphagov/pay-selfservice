'use strict'

const { userServicesContainsGatewayAccount } = require('../../utils/permissions')
const Ledger = require('../../services/clients/ledger.client')
const router = require('../../routes')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { ConnectorClient } = require('../../services/clients/connector.client')
const { NotFoundError } = require('../../errors')
const connector = new ConnectorClient(process.env.CONNECTOR_URL)

module.exports = async function redirectToTransactionDetail (req, res, next) {
  const chargeId = req.params.chargeId

  try {
    const charge = await Ledger.transactionWithAccountOverride(chargeId)
    if (userServicesContainsGatewayAccount(charge.gateway_account_id, req.user)) {
      req.session.contextIsAllServiceTransactions = true

      const account = await connector.getAccount({
        gatewayAccountId: charge.gateway_account_id
      })

      res.redirect(302, formatAccountPathsFor(router.paths.account.transactions.detail, account.external_id, chargeId))
    } else {
      next(new NotFoundError('User does not have access to gateway account for transaction'))
    }
  } catch (err) {
    if (err === 'NOT_FOUND') {
      next(new NotFoundError('Transaction not found'))
    } else {
      next(err)
    }
  }
}
