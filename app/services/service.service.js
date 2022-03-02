'use strict'

const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const getAdminUsersClient = require('./clients/adminusers.client')
const { ConnectorClient } = require('./clients/connector.client')
const CardGatewayAccount = require('../models/GatewayAccount.class')
const Service = require('../models/Service.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const adminUsersClient = getAdminUsersClient()
const { DEFAULT_SERVICE_NAME } = require('../utils/constants')

async function getGatewayAccounts (gatewayAccountIds, correlationId) {
  const cardGatewayAccounts = await connectorClient.getAccounts({
    gatewayAccountIds: gatewayAccountIds,
    correlationId: correlationId
  })

  return cardGatewayAccounts.accounts
    .map(gatewayAccount => new CardGatewayAccount(gatewayAccount).toMinimalJson())
}

async function updateServiceName (serviceExternalId, serviceName, serviceNameCy, correlationId) {
  if (!serviceExternalId) {
    return Promise.reject(new Error('argument: \'serviceExternalId\' cannot be undefined'))
  }

  const result = await adminUsersClient.updateServiceName(serviceExternalId, serviceName, serviceNameCy, correlationId)

  const gatewayAccountIds = lodash.get(result, 'gateway_account_ids', [])

  await Promise.all(
    gatewayAccountIds.map(async gatewayAccountId => {
      if (gatewayAccountId) {
        const value = await connectorClient.patchServiceName(gatewayAccountId, serviceName, correlationId)
        return value
      }
    })
  )

  return new Service(result)
}

function updateService (serviceExternalId, serviceUpdateRequest, correlationId) {
  return adminUsersClient.updateService(serviceExternalId, serviceUpdateRequest, correlationId)
}

async function createService (serviceName, serviceNameCy, user, correlationId) {
  if (!serviceName) serviceName = DEFAULT_SERVICE_NAME
  if (!serviceNameCy) serviceNameCy = ''

  const service = await adminUsersClient.createService(serviceName, serviceNameCy, correlationId)
  logger.info('New service added by existing user')

  const gatewayAccount = await connectorClient.createGatewayAccount('sandbox', 'test', serviceName, null, service.externalId, correlationId)
  logger.info('New test card gateway account registered with service')

  // @TODO(sfount) PP-8438 support existing method of associating services with internal card accounts, this should be
  //               removed once connector integration indexed by services have been migrated
  await adminUsersClient.addGatewayAccountsToService(service.externalId, [gatewayAccount.gateway_account_id])
  logger.info('Service associated with internal gateway account ID with legacy mapping')

  return service
}

function toggleCollectBillingAddress (serviceExternalId, collectBillingAddress, correlationId) {
  return adminUsersClient.updateCollectBillingAddress(serviceExternalId, collectBillingAddress, correlationId)
}

function updateCurrentGoLiveStage (serviceExternalId, newStage, correlationId) {
  return adminUsersClient.updateCurrentGoLiveStage(serviceExternalId, newStage, correlationId)
}

function addStripeAgreementIpAddress (serviceExternalId, ipAddress, correlationId) {
  return adminUsersClient.addStripeAgreementIpAddress(serviceExternalId, ipAddress, correlationId)
}

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
