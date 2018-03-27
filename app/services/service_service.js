'use strict'

const q = require('q')
const lodash = require('lodash')
const getAdminUsersClient = require('./clients/adminusers_client')
const {ConnectorClient} = require('../services/clients/connector_client')
const directDebitConnectorClient = require('../services/clients/direct_debit_connector_client')
const {isADirectDebitAccount} = directDebitConnectorClient
const productsClient = require('../services/clients/products_client')
const CardGatewayAccount = require('../models/GatewayAccount.class')
const Service = require('../models/Service.class')
const winston = require('winston')

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
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
 * @returns {Promise<GatewayAccount[]>} promise of collection of gateway accounts which belong to this service
 */
function getGatewayAccounts (gatewayAccountIds, correlationId) {
  const accounts = lodash.partition(gatewayAccountIds, id => isADirectDebitAccount(id))
  const fetchCardGatewayAccounts = Promise.all(accounts[1]
    .map(gatewayAccountId => connectorClient.getAccount({
      gatewayAccountId: gatewayAccountId,
      correlationId: correlationId
    }).then(ga => new CardGatewayAccount(ga).toMinimalJson())
      .catch((err) => {
        winston.error('Failed to retrieve card gateway account with id', gatewayAccountId)
        return new Error(err)
      })))
  const fetchDirectDebitGatewayAccounts = Promise.all(accounts[0]
    .map(gatewayAccountId => directDebitConnectorClient.gatewayAccount.get({
      gatewayAccountId: gatewayAccountId,
      correlationId: correlationId
    }).then(ga => ga.toMinimalJson())
      .catch((err) => {
        winston.error('Failed to retrieve dd gateway account with id', gatewayAccountId)
        return new Error(err)
      })))

  return Promise.all([fetchCardGatewayAccounts, fetchDirectDebitGatewayAccounts]
    .map(promise => promise))
    .then(results => results
        .reduce((a, b) => a.concat(b))
        .filter(p => !(p instanceof Error)))
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
      if (gatewayAccountIds.length <= 0) {
        return q.resolve(new Service(result))
      } else {
        const accounts = lodash.partition(gatewayAccountIds, id => isADirectDebitAccount(id))
        return q.all([
          ...accounts[1].map(gatewayAccountId => connectorClient.patchServiceName(gatewayAccountId, serviceName, correlationId)),
          ...accounts[1].map(gatewayAccountId => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId, serviceName))
        ])
          .then(() => q.resolve(new Service(result)))
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

  return connectorClient.createGatewayAccount('sandbox', 'test', serviceName, null, correlationId)
    .then(gatewayAccount =>
      getAdminUsersClient({correlationId}).createService(serviceName, [gatewayAccount.gateway_account_id])
    )
}
