'use strict'

const q = require('q');
const getAdminUsersClient = require('./clients/adminusers_client')
const {ConnectorClient} = require('../services/clients/connector_client')
const GatewayAccount = require('../models/GatewayAccount.class');
const Service = require('../models/Service.class')

const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
// Exports
module.exports = {
  getGatewayAccounts,
  updateServiceName
}

/**
 * @method getServicesForUser
 * @param {string[]} gatewayAccountIds - The ids of interested gateway accounts.
 *
 * @returns {GatewayAccount[]} collection of gateway accounts which belong to this service
 */
function getGatewayAccounts (gatewayAccountIds, correlationId) {
  return q.allSettled(gatewayAccountIds
    .map(gatewayAccountId => connectorClient().getAccount({
      gatewayAccountId: gatewayAccountId,
      correlationId: correlationId
    })))
    .then(gatewayAccountPromises => gatewayAccountPromises
      .filter(promise => promise.state === 'fulfilled')
      .map(promise => promise.value))
    .then(gatewayAccountsData => gatewayAccountsData
      .map(accountData => new GatewayAccount(accountData).toMinimalJson()))
}

/**
 * Update service name
 *
 * @param serviceExternalId
 * @param serviceName
 * @param correlationId
 * @returns {Promise<Service>} the updated service
 */
function updateServiceName(serviceExternalId, serviceName, correlationId) {
  if(!serviceExternalId) return q.reject(new Error(`argument: 'serviceExternalId' cannot be undefined`));
  if(!serviceName) serviceName = 'System Generated'

  return getAdminUsersClient({correlationId}).updateServiceName(serviceExternalId, serviceName)
    .then(result => {
      const gatewayAccountIds = result.gateway_account_ids || []
      // Update gateway account service names
      if (gatewayAccountIds.length > 0) {
        return q.allSettled([].concat(gatewayAccountIds).map(gateway_account_id => {
          connectorClient().patchServiceName(gateway_account_id, serviceName, correlationId)
        })).then(() => {
          q.resolve(new Service(result))
        })
      } else {
        return q.resolve(new Service(result))
      }
    })
}
