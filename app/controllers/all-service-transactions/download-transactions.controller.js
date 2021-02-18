'use strict'

const date = require('../../utils/dates')
const transactionService = require('../../services/transaction.service')
const Stream = require('../../services/clients/stream.client')
const { CORRELATION_HEADER } = require('../../utils/correlation-header')
const permissions = require('../../utils/permissions')
const { NoServicesWithPermissionError } = require('../../errors')

module.exports = async function dowmloadTransactions (req, res, next) {
  const filters = req.query
  const correlationId = req.headers[CORRELATION_HEADER]
  const name = `GOVUK_Pay_${date.dateToDefaultFormat(new Date()).replace(' ', '_')}.csv`

  try {
    const userPermittedAccountsSummary = await permissions.getGatewayAccountsFor(req.user, true, 'transactions:read')
    if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
      return next(new NoServicesWithPermissionError('You do not have any associated services with rights to view live transactions.'))
    }
    filters.feeHeaders = userPermittedAccountsSummary.headers.shouldGetStripeHeaders
    filters.motoHeader = userPermittedAccountsSummary.headers.shouldGetMotoHeaders
    const url = transactionService.csvSearchUrl(filters, userPermittedAccountsSummary.gatewayAccountIds)

    const timestampStreamStart = Date.now()
    const data = (chunk) => { res.write(chunk) }
    const complete = () => {
      transactionService.logCsvFileStreamComplete(timestampStreamStart, filters, userPermittedAccountsSummary.gatewayAccountIds, req.user, correlationId, true)
      res.end()
    }
    const error = () => next(new Error('Unable to download list of transactions.'))
    const client = new Stream(data, complete, error)

    res.setHeader('Content-disposition', `attachment; filename="${name}"`)
    res.setHeader('Content-Type', 'text/csv')

    client.request(url, correlationId)
  } catch (err) {
    next(new Error('Unable to download list of transactions.'))
  }
}
