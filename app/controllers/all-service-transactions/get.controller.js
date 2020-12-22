'use strict'

const _ = require('lodash')

const { response, renderErrorView } = require('../../utils/response')
const { ConnectorClient } = require('../../services/clients/connector.client.js')
const transactionService = require('../../services/transaction.service')
const { buildPaymentList } = require('../../utils/transaction-view.js')
const permissions = require('../../utils/permissions')
const { getFilters, describeFilters } = require('../../utils/filters.js')
const router = require('../../routes.js')
const states = require('../../utils/states')
const client = new ConnectorClient(process.env.CONNECTOR_URL)
const logger = require('../../utils/logger')(__filename)
const { keys } = require('@govuk-pay/pay-js-commons').logging

const { CORRELATION_HEADER } = require('../../utils/correlation-header.js')

module.exports = async (req, res) => {
  const correlationId = req.headers[CORRELATION_HEADER] || ''
  const filters = getFilters(req)
  try {
    const userPermittedAccountsSummary = await permissions.getLiveGatewayAccountsFor(req.user, 'transactions:read')

    const logContext = {
      gateway_account_ids: userPermittedAccountsSummary.gatewayAccountIds,
      user_number_of_live_services: req.user.numberOfLiveServices,
      internal_user: req.user.internalUser
    }
    logContext[keys.USER_EXTERNAL_ID] = req.user && req.user.externalId
    logContext[keys.CORRELATION_ID] = correlationId
    logger.info('Listing all live services transactions', logContext)

    if (!userPermittedAccountsSummary.gatewayAccountIds.length) {
      res.status(401).render('error', { message: 'You do not have any associated services with rights to view live transactions.' })
      return
    }
    const searchResultOutput = await transactionService.search(userPermittedAccountsSummary.gatewayAccountIds, filters.result)
    const cardTypes = await client.getAllCardTypes(correlationId)
    const model = buildPaymentList(searchResultOutput, cardTypes, null, filters.result, router.paths.allServiceTransactions.download, req.session.backPath)
    delete req.session.backPath
    model.search_path = router.paths.allServiceTransactions.index
    model.filtersDescription = describeFilters(filters.result)
    model.eventStates = states.allDisplayStateSelectorObjects()
      .map(state => {
        return {
          value: state.key,
          text: state.name,
          selected: filters.result.selectedStates && filters.result.selectedStates.includes(state.name)
        }
      })
    model.eventStates.unshift({ value: '', text: 'Any', selected: false })

    model.stateFiltersFriendly = model.eventStates
      .filter(state => state.selected)
      .map(state => state.text)
      .join(', ')
    if (_.has(filters.result, 'brand')) {
      model.cardBrands.forEach(brand => {
        brand.selected = filters.result.brand.includes(brand.value)
      })
    }
    model.filterRedirect = router.paths.allServiceTransactions.index
    model.clearRedirect = router.paths.allServiceTransactions.index
    model.isStripeAccount = userPermittedAccountsSummary.headers.shouldGetStripeHeaders
    model.allServiceTransactions = true

    return response(req, res, 'transactions/index', model)
  } catch (err) {
    renderErrorView(req, res, 'Unable to fetch transaction information')
  }
}
