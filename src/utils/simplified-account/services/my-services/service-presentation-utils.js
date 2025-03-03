const formatAccountPathsFor = require('@utils/format-account-paths-for')
const paths = require('@root/paths')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const formatServicePathsFor = require('@utils/format-service-paths-for')
const { WORLDPAY } = require('@models/constants/payment-providers')

/**
 * @param {GatewayAccount} account
 * @param {GOVUKPayService} service
 * @param {boolean} userIsDegatewayed
 * @returns {{dashboardLink: String, editServiceNameLink: String, manageTeamMembersLink: String, organisationDetailsLink: String}}
 */
const accountLinksGenerator = (account, service, userIsDegatewayed) => {
  return {
    dashboardLink: formatAccountPathsFor(paths.account.dashboard.index, account.externalId),
    editServiceNameLink: userIsDegatewayed
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, service.externalId, account.type)
      : formatServicePathsFor(paths.service.editServiceName.index, service.externalId),
    manageTeamMembersLink: userIsDegatewayed
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, service.externalId, account.type)
      : formatServicePathsFor(paths.service.teamMembers.index, service.externalId),
    organisationDetailsLink: userIsDegatewayed
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, service.externalId, account.type)
      : formatServicePathsFor(paths.service.organisationDetails.index, service.externalId)
  }
}

/**
 * Sorts objects by presence of 'live' gateway accounts, then alphabetically by name.
 * @param {{gatewayAccounts: Array<{type: string}>, name: string}} a - First object to compare
 * @param {{gatewayAccounts: Array<{type: string}>, name: string}} b - Second object to compare
 * @returns {number} Sorting order: objects with live accounts first, then alphabetical
 */
const sortByLiveThenName = (a, b) => {
  const aHasLive = a.gatewayAccounts.some(account => account.type === 'live')
  const bHasLive = b.gatewayAccounts.some(account => account.type === 'live')
  if (aHasLive !== bHasLive) return bHasLive ? 1 : -1
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
}

/**
 * @param {Array<{type: string, paymentProvider: string}>} gatewayAccounts
 * @returns {boolean}
 */
const isWorldpayTestService = (gatewayAccounts) => {
  return gatewayAccounts.length === 1 && gatewayAccounts[0].type === 'test' &&
    gatewayAccounts[0].paymentProvider === WORLDPAY
}

module.exports = {
  accountLinksGenerator,
  sortByLiveThenName,
  isWorldpayTestService
}
