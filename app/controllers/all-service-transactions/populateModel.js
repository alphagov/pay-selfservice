const { buildPaymentList } = require('../../utils/transaction-view')
const paths = require('../../paths')
const { describeFilters } = require('../../utils/filters')
const states = require('../../utils/states')
const _ = require('lodash')
const { ConnectorClient } = require('../../services/clients/connector.client')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

async function populateModel (req, searchResultOutput, filters, downloadRoute, filterLiveAccounts, userPermittedAccountsSummary) {
  const cardTypes = await client.getAllCardTypes()
  const model = buildPaymentList(searchResultOutput, cardTypes, null, filters.result, filters.dateRangeState, downloadRoute, req.session.backPath)
  delete req.session.backPath
  model.search_path = filterLiveAccounts ? paths.allServiceTransactions.index : paths.formattedPathFor(paths.allServiceTransactions.indexStatusFilter, 'test')
  model.filtersDescription = describeFilters(filters.result)
  model.eventStates = states.allDisplayStateSelectorObjects(userPermittedAccountsSummary.hasStripeAccount)
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

  model.clearRedirect = model.search_path
  model.isStripeAccount = userPermittedAccountsSummary.headers.shouldGetStripeHeaders
  model.allServiceTransactions = true
  model.filterLiveAccounts = filterLiveAccounts
  model.hasLiveAccounts = userPermittedAccountsSummary.hasLiveAccounts
  model.recurringEnabled = userPermittedAccountsSummary.hasRecurringAccount
  model.isExperimentalFeaturesEnabled = req.user.serviceRoles.some(serviceRole => serviceRole.service.experimentalFeaturesEnabled)

  return model
}

module.exports = { populateModel }
