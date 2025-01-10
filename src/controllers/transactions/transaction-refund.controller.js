'use strict'

const { refund } = require('../../services/transaction.service')
const router = require('../../routes.js')
const { safeConvertPoundsStringToPence } = require('../../utils/currency-formatter')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')

const refundTransaction = async function refundTransaction (req, res, next) {
  try {
    const userExternalId = req.user.externalId
    const userEmail = req.user.email
    const accountId = req.account.gateway_account_id
    const { chargeId } = req.params
    const transactionDetailPath = formatAccountPathsFor(router.paths.account.transactions.detail, req.account.external_id, chargeId)

    const isFullRefund = req.body['refund-type'] === 'full'
    const refundAmount = isFullRefund ? req.body['full-amount'] : req.body['refund-amount']
    const refundAmountAvailableInPence = parseInt(req.body['refund-amount-available-in-pence'])
    const contextIsAllServiceTransactions = req.body['context-is-all-services-transactions'] === 'true'

    const refundAmountInPence = safeConvertPoundsStringToPence(refundAmount)
    if (!refundAmountInPence) {
      req.flash('refundError', 'Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”')
      return res.redirect(transactionDetailPath)
    }

    try {
      await refund(accountId, chargeId, refundAmountInPence, refundAmountAvailableInPence, userExternalId, userEmail)
      req.flash('refundSuccess', 'true')
    } catch (err) {
      req.flash('refundError', err.message)
    }

    if (contextIsAllServiceTransactions) {
      req.session.contextIsAllServiceTransactions = true
    }
    res.redirect(transactionDetailPath)
  } catch (err) {
    next(err)
  }
}

module.exports = refundTransaction
