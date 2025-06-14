'use strict'

const lodash = require('lodash')

const logger = require('../utils/logger')(__filename)
const getAdminUsersClient = require('./clients/adminusers.client')
const { ConnectorClient } = require('./clients/connector.client')
const Service = require('@models/service/Service.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const adminUsersClient = getAdminUsersClient()
const { DEFAULT_SERVICE_NAME } = require('@utils/constants')
const { CREATED } = require('@models/constants/psp-test-account-stage')

async function updateServiceName (serviceExternalId, serviceName, serviceNameCy) {
  if (!serviceExternalId) {
    return Promise.reject(new Error('argument: \'serviceExternalId\' cannot be undefined'))
  }

  const result = await adminUsersClient.updateServiceName(serviceExternalId, serviceName, serviceNameCy)

  const gatewayAccountIds = lodash.get(result, 'gateway_account_ids', [])

  // TODO update this to use the service and account type model api endpoint
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

  const sandboxGatewayAccount = await connectorClient.createGatewayAccount('sandbox', 'test', serviceName, null, service.externalId)
  logger.info('New test card gateway account registered with service')

  let stripeTestGatewayAccount
  if (serviceOrgType === 'local') {
    stripeTestGatewayAccount = await connectorClient.requestStripeTestAccount(service.externalId)
    logger.info('Sandbox gateway account converted to Stripe Test gateway account')
  }

  // @TODO(sfount) PP-8438 support existing method of associating services with internal card accounts, this should be
  //               removed once connector integration indexed by services have been migrated

  const actualAccountId = stripeTestGatewayAccount ? stripeTestGatewayAccount.gateway_account_id : sandboxGatewayAccount.id
  await adminUsersClient.addGatewayAccountsToService(service.externalId, [actualAccountId])
  if (stripeTestGatewayAccount) {
    await adminUsersClient.updatePspTestAccountStage(service.externalId, CREATED)
  }
  logger.info('Service associated with internal gateway account ID with legacy mapping')

  return {
    service
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
  updateService,
  updateServiceName,
  createService,
  toggleCollectBillingAddress,
  updateCurrentGoLiveStage,
  addStripeAgreementIpAddress,
  addGovUkAgreementEmailAddress
}
