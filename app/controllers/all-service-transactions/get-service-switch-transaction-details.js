'use strict'

const logger = require('../../utils/logger')(__filename)
const paths = require('../../paths')
const validAccountId = require('../../utils/valid_account_id.js')
const router = require('../../routes.js')

module.exports = (req, res) => {
  let newAccountId = req.params.serviceId
  const chargeId = req.params.chargeId

  if (validAccountId(newAccountId, req.user)) {
    req.gateway_account.currentGatewayAccountId = newAccountId
    res.redirect(302, router.generateRoute(paths.transactions.detail, { chargeId }))
  } else {
    logger.warn(`Attempted to switch to invalid account ${newAccountId}`)
    res.redirect(302, paths.allServiceTransactions)
  }
}
