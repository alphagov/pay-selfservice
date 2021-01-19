'use strict'

const { ledgerFindWithEvents } = require('../../services/transaction.service')
const { response } = require('../../utils/response.js')
const { renderErrorView } = require('../../utils/response.js')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const router = require('../../routes')

const defaultMsg = 'Error processing transaction view'
const notFound = 'Charge not found'

module.exports = (req, res) => {
  const accountId = req.account.gateway_account_id
  const chargeId = req.params.chargeId

  ledgerFindWithEvents(accountId, chargeId, req.correlationId)
    .then(data => {
      data.indexFilters = req.session.filters
      if (req.session.backLink) {
        data.redirectBackLink = req.session.backLink
        delete req.session.backLink
      }
      data.service = req.service

      const refundUrl = router.generateRoute(formatAccountPathsFor(router.paths.account.transactions.refund, req.account.external_id), { chargeId })

      data.refundUrl = refundUrl
      response(req, res, 'transaction-detail/index', data)
    })
    .catch(err => {
      if (err === 'NOT_FOUND') {
        renderErrorView(req, res, notFound, 404)
      } else {
        renderErrorView(req, res, defaultMsg, 500)
      }
    })
}
