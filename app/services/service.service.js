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

async function getGatewayAccounts (gatewayAccountIds) {
  const cardGatewayAccounts = await connectorClient.getAccounts({
    gatewayAccountIds: gatewayAccountIds
  })

  return cardGatewayAccounts.accounts
    .map(gatewayAccount => new CardGatewayAccount(gatewayAccount).toMinimalJson())
}

async function updateServiceName (serviceExternalId, serviceName, serviceNameCy) {
  if (!serviceExternalId) {
    return Promise.reject(new Error(`argument: 'serviceExternalId' cannot be undefined`))
  }

  const result = await adminUsersClient.updateServiceName(serviceExternalId, serviceName, serviceNameCy)

  const gatewayAccountIds = lodash.get(result, 'gateway_account_ids', [])

  await Promise.all(
    gatewayAccountIds.map(async gatewayAccountId => {
      if (gatewayAccountId) {
        const value = await connectorClient.patchServiceName(gatewayAccountId, serviceName)
        return value
      }
    })
  )

  return new Service(result)
}

function updateService (serviceExternalId, serviceUpdateRequest) {
  return adminUsersClient.updateService(serviceExternalId, serviceUpdateRequest)
}

async function createService (serviceName, serviceNameCy, serviceOrgType = 'central') {
  if (!serviceName) serviceName = DEFAULT_SERVICE_NAME
  if (!serviceNameCy) serviceNameCy = ''

  const service = await adminUsersClient.createService(serviceName, serviceNameCy)
  logger.info('New service added by existing user')

  const gatewayAccount = await connectorClient.createGatewayAccount('sandbox', 'test', serviceName, null, service.externalId)
  logger.info('New test card gateway account registered with service')

  let stripeTestGatewayAccount
  if (serviceOrgType === 'local') {
    stripeTestGatewayAccount = await connectorClient.requestStripeTestAccount(service.externalId)
    logger.info(stripeTestGatewayAccount)
  }

  // @TODO(sfount) PP-8438 support existing method of associating services with internal card accounts, this should be
  //               removed once connector integration indexed by services have been migrated

  const actualAccountId = stripeTestGatewayAccount ? stripeTestGatewayAccount.gateway_account_id : gatewayAccount.gateway_account_id
  await adminUsersClient.addGatewayAccountsToService(service.externalId, [actualAccountId])
  logger.info('Service associated with internal gateway account ID with legacy mapping')

  return {
    service,
    externalAccountId: stripeTestGatewayAccount ? stripeTestGatewayAccount.gateway_account_external_id : gatewayAccount.external_id
  }
}

function toggleCollectBillingAddress (serviceExternalId, collectBillingAddress) {
  return adminUsersClient.updateCollectBillingAddress(serviceExternalId, collectBillingAddress)
}

function updateCurrentGoLiveStage (serviceExternalId, newStage) {
  return adminUsersClient.updateCurrentGoLiveStage(serviceExternalId, newStage)
}

function addStripeAgreementIpAddress (serviceExternalId, ipAddress) {
  return adminUsersClient.addStripeAgreementIpAddress(serviceExternalId, ipAddress)
}

function addGovUkAgreementEmailAddress (serviceExternalId, userExternalId) {
  return adminUsersClient.addGovUkAgreementEmailAddress(serviceExternalId, userExternalId)
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
