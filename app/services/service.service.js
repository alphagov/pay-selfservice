'use strict'

const lodash = require('lodash')
const { keys } = require('@govuk-pay/pay-js-commons').logging

const logger = require('../utils/logger')(__filename)
const getAdminUsersClient = require('./clients/adminusers.client')
const { ConnectorClient } = require('./clients/connector.client')
const directDebitConnectorClient = require('./clients/direct-debit-connector.client')
const { isADirectDebitAccount } = directDebitConnectorClient
const CardGatewayAccount = require('../models/GatewayAccount.class')
const Service = require('../models/Service.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

async function getGatewayAccounts (gatewayAccountIds, correlationId) {
  const cardGatewayAccountIds = gatewayAccountIds.filter(id => !isADirectDebitAccount(id))

  const cardGatewayAccounts = await connectorClient.getAccounts({
    gatewayAccountIds: cardGatewayAccountIds,
    correlationId: correlationId
  })

  return cardGatewayAccounts.accounts
    .map(gatewayAccount => new CardGatewayAccount(gatewayAccount).toMinimalJson())
}

function updateServiceName (serviceExternalId, serviceName, serviceNameCy, correlationId) {
  if (!serviceExternalId) {
    return Promise.reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
  }
  return getAdminUsersClient({ correlationId }).updateServiceName(serviceExternalId, serviceName, serviceNameCy)
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

function updateService (serviceExternalId, serviceUpdateRequest, correlationId) {
  return getAdminUsersClient({ correlationId }).updateService(serviceExternalId, serviceUpdateRequest)
}

async function createService (serviceName, serviceNameCy, user, correlationId) {
  if (!serviceName) serviceName = 'System Generated'
  if (!serviceNameCy) serviceNameCy = ''

  const gatewayAccount = await connectorClient.createGatewayAccount('sandbox', 'test', serviceName, null, correlationId)
  const service = await getAdminUsersClient({ correlationId }).createService(serviceName, serviceNameCy, [gatewayAccount.gateway_account_id])

  const logContext = {
    internal_user: user.internalUser
  }
  logContext[keys.USER_EXTERNAL_ID] = user.externalId
  logContext[keys.SERVICE_EXTERNAL_ID] = service.externalId
  logContext[keys.GATEWAY_ACCOUNT_ID] = gatewayAccount.gateway_account_id
  logger.info('New service added by existing user', logContext)

  return service
}

function toggleCollectBillingAddress (serviceExternalId, collectBillingAddress, correlationId) {
  return getAdminUsersClient({ correlationId }).updateCollectBillingAddress(serviceExternalId, collectBillingAddress)
}

function updateCurrentGoLiveStage (serviceExternalId, newStage, correlationId) {
  return getAdminUsersClient({ correlationId }).updateCurrentGoLiveStage(serviceExternalId, newStage)
}

function addStripeAgreementIpAddress (serviceExternalId, ipAddress, correlationId) {
  return getAdminUsersClient({ correlationId }).addStripeAgreementIpAddress(serviceExternalId, ipAddress)
}

function addGovUkAgreementEmailAddress (serviceExternalId, userExternalId, correlationId) {
  return getAdminUsersClient({ correlationId }).addGovUkAgreementEmailAddress(serviceExternalId, userExternalId)
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
