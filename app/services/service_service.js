'use strict'

const q = require('q')
const lodash = require('lodash')
const getAdminUsersClient = require('./clients/adminusers_client')
const {ConnectorClient} = require('../services/clients/connector_client')
const GatewayAccount = require('../models/GatewayAccount.class')
const Service = require('../models/Service.class')

const connectorClient = () => new ConnectorClient(process.env.CONNECTOR_URL)
// Exports
module.exports = {
  getGatewayAccounts,
  updateServiceName,
  updateMerchantDetails,
  createService
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
function updateServiceName (serviceExternalId, serviceName, correlationId) {
  if (!serviceExternalId) return q.reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
  if (!serviceName) serviceName = 'System Generated'

  return getAdminUsersClient({correlationId}).updateServiceName(serviceExternalId, serviceName)
    .then(result => {
      const gatewayAccountIds = lodash.get(result, 'gateway_account_ids', [])
      // Update gateway account service names
      if (gatewayAccountIds.length > 0) {
        return q.all([].concat(gatewayAccountIds).map(gatewayAccountId => {
          connectorClient().patchServiceName(gatewayAccountId, serviceName, correlationId)
        })).then(() => {
          q.resolve(new Service(result))
        })
      } else {
        return q.resolve(new Service(result))
      }
    })
}

/**
 * Update merchant details
 *
 * @param serviceExternalId
 * @param merchantDetails
 * @param correlationId
 * @returns {Promise<Service>} the updated service
 */
function updateMerchantDetails (serviceExternalId, merchantDetails, correlationId) {
  if (!serviceExternalId) return q.reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
  if (!merchantDetails) return q.reject(new Error(`argument: 'merchantDetails' cannot be undefined`))

  return getAdminUsersClient({correlationId}).updateMerchantDetails(serviceExternalId, merchantDetails)
    .then(result => {
      return q.resolve(new Service(result))
    })
}

/**
 * Create a new service with a sandbox account
 * @param serviceName
 * @param correlationId
 * @returns {*|Promise|Promise<Service>} the created service
 */
function createService (serviceName, correlationId) {
  if (!serviceName) serviceName = 'System Generated'

  return connectorClient().createGatewayAccount('sandbox', 'test', serviceName, null, correlationId)
    .then(gatewayAccount =>
      getAdminUsersClient({correlationId}).createService(serviceName, [gatewayAccount.gateway_account_id])
    )
}
