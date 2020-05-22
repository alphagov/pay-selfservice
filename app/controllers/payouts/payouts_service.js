const moment = require('moment')

const Ledger = require('../../../app/services/clients/ledger_client')

const getPayoutDate = function getPayoutDate (payout) {
  return payout.paid_out_date || payout.created_date
}

const sortPayoutByDateString = function sortPayoutByDateString (a, b) {
  return new Date(getPayoutDate(a)) - new Date(getPayoutDate(b))
}

const indexServiceNamesByGatewayAccountId = function indexServiceNamesByGatewayAccountId (user) {
  return user.serviceRoles.reduce((aggregate, serviceRole) => {
    serviceRole.service.gatewayAccountIds.forEach((gatewayAccountId) => {
      aggregate[gatewayAccountId] = serviceRole.service.serviceName.en
    })
    return aggregate
  }, {})
}
/*
{
  'YYYY-MM-DD': {
    date
    entries
  }
]
*/
// @TODO(sfount) seperate the user and payout getting
const groupPayoutsByDate = function groupPayoutsByDate (payouts, user) {
  let serviceNameMap = {}
  const groups = {}

  if (user) {
    serviceNameMap = indexServiceNamesByGatewayAccountId(user)
  }
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

// @TODO(sfount) seperate the user and payout getting
const payouts = async function payouts (gatewayAccountId, user) {
  const payoutSearchResponse = await Ledger.payouts(gatewayAccountId)
  return groupPayoutsByDate(payoutSearchResponse.results, user)
}

module.exports = {
  groupPayoutsByDate,
  payouts
}
