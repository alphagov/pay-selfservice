'use strict'

// NPM dependencies
const lodash = require('lodash')
const winston = require('winston')

// Local dependencies
const getAdminUsersClient = require('./clients/adminusers_client')
const {ConnectorClient} = require('../services/clients/connector_client')
const directDebitConnectorClient = require('../services/clients/direct_debit_connector_client')
const {isADirectDebitAccount} = directDebitConnectorClient
const productsClient = require('../services/clients/products_client')
const CardGatewayAccount = require('../models/GatewayAccount.class')
const DirectDebitGatewayAccount = require('../models/DirectDebitGatewayAccount.class')
const Service = require('../models/Service.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

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

  const fetchCardGatewayAccounts = accounts[1].length > 0 ?
    connectorClient.getAccounts({
      gatewayAccountIds: accounts[1],
      correlationId: correlationId
    }) : Promise.resolve([])

  const fetchDirectDebitGatewayAccounts = accounts[0].length > 0 ?
    directDebitConnectorClient.gatewayAccounts.get({
      gatewayAccountIds: accounts[0],
      correlationId: correlationId
    }) : Promise.resolve([])

  const returnGatewayAccountVariant = ga => isADirectDebitAccount(ga.gateway_account_id)
    ? new DirectDebitGatewayAccount(ga).toMinimalJson()
    : new CardGatewayAccount(ga).toMinimalJson()

  return Promise.all([fetchCardGatewayAccounts, fetchDirectDebitGatewayAccounts])
    .then(results => {
      return results
        .reduce((accumulator, currentValue) => {
          return currentValue.accounts ? accumulator.concat(currentValue.accounts) : accumulator
        }, [])
        .map(returnGatewayAccountVariant)
        .filter(p => !(p instanceof Error))
    })
    .catch(err => {
      return new Error(err)
    })
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
  return new Promise(function (resolve, reject) {
    if (!serviceExternalId) reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
    if (!serviceName) serviceName = 'System Generated'

    getAdminUsersClient({correlationId}).updateServiceName(serviceExternalId, serviceName)
      .then(result => {
        const gatewayAccountIds = lodash.get(result, 'gateway_account_ids', [])

        // Update gateway account service names
        if (gatewayAccountIds.length <= 0) {
          return resolve(new Service(result))
        } else {
          const accounts = lodash.partition(gatewayAccountIds, id => isADirectDebitAccount(id))
          return Promise.all([
            ...accounts[1].map(gatewayAccountId => connectorClient.patchServiceName(gatewayAccountId, serviceName, correlationId)),
            ...accounts[1].map(gatewayAccountId => productsClient.product.updateServiceNameOfProductsByGatewayAccountId(gatewayAccountId, serviceName))
          ])
            .then(() => resolve(new Service(result)))
        }
      })
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
  return new Promise(function (resolve, reject) {
    if (!serviceExternalId) return reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
    if (!merchantDetails) return reject(new Error(`argument: 'merchantDetails' cannot be undefined`))
    getAdminUsersClient({correlationId}).updateMerchantDetails(serviceExternalId, merchantDetails)
      .then(result => {
        return resolve(new Service(result))
      })
      .catch(function (err) {
        return reject(err)
      })
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
