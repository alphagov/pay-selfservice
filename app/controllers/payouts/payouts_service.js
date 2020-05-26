const moment = require('moment')

const Ledger = require('../../../app/services/clients/ledger_client')

const { indexServiceNamesByGatewayAccountId } = require('./user_services_names')

const getPayoutDate = function getPayoutDate (payout) {
  return payout.paid_out_date || payout.created_date
}

const sortPayoutByDateString = function sortPayoutByDateString (a, b) {
  return new Date(getPayoutDate(a)) - new Date(getPayoutDate(b))
}

const groupPayoutsByDate = function groupPayoutsByDate (payouts, user) {
  const serviceNameMap = indexServiceNamesByGatewayAccountId(user)
  const groups = {}

  payouts.sort(sortPayoutByDateString)
  payouts.forEach((payout) => {
    const date = moment(getPayoutDate(payout))
    const key = date.format('YYYY-MM-DD')
    payout.serviceName = serviceNameMap[payout.gateway_account_id] || '(No service name)'

    groups[key] = groups[key] || { date, entries: [] }
    groups[key].entries.push(payout)
  })

  return groups
}

const payouts = async function payouts (gatewayAccountId, user = {}) {
  const payoutSearchResponse = await Ledger.payouts(gatewayAccountId)
  return groupPayoutsByDate(payoutSearchResponse.results, user)
}

module.exports = {
  payouts,
  groupPayoutsByDate
}
