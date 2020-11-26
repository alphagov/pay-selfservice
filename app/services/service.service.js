'use strict'

const lodash = require('lodash')

const getAdminUsersClient = require('./clients/adminusers.client')
const { ConnectorClient } = require('./clients/connector.client')
const directDebitConnectorClient = require('./clients/direct-debit-connector.client')
const { isADirectDebitAccount } = directDebitConnectorClient
const CardGatewayAccount = require('../models/GatewayAccount.class')
const Service = require('../models/Service.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const adminUsersClient = getAdminUsersClient()

/**
 * @method getServicesForUser
 * @param {string[]} gatewayAccountIds - The ids of interested gateway accounts.
 *
 * @returns {Promise<GatewayAccount[]>} promise of collection of gateway accounts which belong to this service
 */
async function getGatewayAccounts (gatewayAccountIds, correlationId) {
  const cardGatewayAccountIds = gatewayAccountIds.filter(id => !isADirectDebitAccount(id))

  const cardGatewayAccounts = await connectorClient.getAccounts({
    gatewayAccountIds: cardGatewayAccountIds,
    correlationId: correlationId
  })

  return cardGatewayAccounts.accounts
    .map(gatewayAccount => new CardGatewayAccount(gatewayAccount).toMinimalJson())
}

/**
 * Update service name
 *
 * @param serviceExternalId
 * @param serviceName
 * @param correlationId
 * @returns {Promise<Service>} the updated service
 */
function updateServiceName (serviceExternalId, serviceName, serviceNameCy, correlationId) {
  if (!serviceExternalId) {
    return Promise.reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
  }
  return adminUsersClient.updateServiceName(serviceExternalId, serviceName, serviceNameCy, correlationId)
    .then(result => {
      // Update gateway account service names in connector
      const gatewayAccountIds = lodash.get(result, 'gateway_account_ids', [])
      return Promise.all(gatewayAccountIds.map(gatewayAccountId => {
        if (gatewayAccountId && !isADirectDebitAccount(gatewayAccountId)) {
          return connectorClient.patchServiceName(gatewayAccountId, serviceName, correlationId)
        }
      })
      )
        .then(() => result)
    })
    .then(result => {
      return new Service(result)
    })
}

/**
 * Update the service
 *
 * @param serviceExternalId
 * @param merchantDetails
 * @param correlationId
 * @returns {Promise<Service>} the updated service
 */
function updateService (serviceExternalId, serviceUpdateRequest, correlationId) {
  return adminUsersClient.updateService(serviceExternalId, serviceUpdateRequest, correlationId)
}

/**
 * Create a new service with a sandbox account
 * @param serviceName
 * @param correlationId
 * @returns {*|Promise|Promise<Service>} the created service
 */
function createService (serviceName, serviceNameCy, correlationId) {
  if (!serviceName) serviceName = 'System Generated'
  if (!serviceNameCy) serviceNameCy = ''

  return connectorClient.createGatewayAccount('sandbox', 'test', serviceName, null, correlationId)
    .then(gatewayAccount =>
      adminUsersClient.createService(serviceName, serviceNameCy, [gatewayAccount.gateway_account_id], correlationId)
    )
}

/**
 * Update the collect billing address setting
 *
 * @param serviceExternalId
 * @param collectBillingAddress
 * @param correlationId
 * @returns {*|Promise|Promise}
 */
function toggleCollectBillingAddress (serviceExternalId, collectBillingAddress, correlationId) {
  return adminUsersClient.updateCollectBillingAddress(serviceExternalId, collectBillingAddress, correlationId)
}

/**
 * Update the current go live stage setting
 *
 * @param serviceExternalId
 * @param newStage
 * @param correlationId
 * @returns {*|Promise|Promise}
 */
function updateCurrentGoLiveStage (serviceExternalId, newStage, correlationId) {
  return adminUsersClient.updateCurrentGoLiveStage(serviceExternalId, newStage, correlationId)
}

/**
 * Update the current go live stage setting
 *
 * @param serviceExternalId
 * @param ipAddress
 * @param correlationId
 * @returns {*|Promise|Promise}
 */
function addStripeAgreementIpAddress (serviceExternalId, ipAddress, correlationId) {
  return adminUsersClient.addStripeAgreementIpAddress(serviceExternalId, ipAddress, correlationId)
}

/**
 * Update the current go live stage setting
 *
 * @param serviceExternalId
 * @param ipAddress
 * @param correlationId
 * @returns {*|Promise|Promise}
 */
function addGovUkAgreementEmailAddress (serviceExternalId, userExternalId, correlationId) {
  return adminUsersClient.addGovUkAgreementEmailAddress(serviceExternalId, userExternalId, correlationId)
}

module.exports = {
  getGatewayAccounts,
  updateService,
  updateServiceName,
  createService,
  toggleCollectBillingAddress,
  updateCurrentGoLiveStage,
  addStripeAgreementIpAddress,
  addGovUkAgreementEmailAddress
}
