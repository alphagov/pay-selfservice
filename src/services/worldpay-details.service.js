const { ConnectorClient } = require('./clients/connector.client')
const GatewayAccountCredentialUpdateRequest = require('@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class')
const GatewayAccountUpdateRequest = require('@models/gateway-account/GatewayAccountUpdateRequest.class')
const logger = require('../utils/logger')(__filename)

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {WorldpayCredential} credential
 * @returns {Promise<boolean>}
 */
async function checkCredential (serviceExternalId, accountType, credential) {
  const credentialCheck = await connectorClient.postCheckWorldpayCredentialByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credential
  )
  if (credentialCheck.result !== 'valid') {
    logger.warn(`Credentials provided for service external ID [${serviceExternalId}], account type [${accountType}] failed validation with Worldpay`)
    return false
  }

  logger.info(`Successfully validated credentials for service external ID [${serviceExternalId}], account type [${accountType}] with Worldpay`)
  return true
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {Worldpay3dsFlexCredential} flexCredential
 * @returns {Promise<boolean>}
 */
async function check3dsFlexCredential (serviceExternalId, accountType, flexCredential) {
  const credentialCheck = await connectorClient.postCheckWorldpay3dsFlexCredentialByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    flexCredential
  )
  if (credentialCheck.result !== 'valid') {
    logger.info(`3DS Flex credentials provided for service external ID [${serviceExternalId}], account type [${accountType}] failed validation with Worldpay`)
    return false
  }

  logger.info(`Successfully validated 3DS Flex credentials for service external ID [${serviceExternalId}], account type [${accountType}] with Worldpay`)
  return true
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {String} credentialId
 * @param {String} userExternalId
 * @param {WorldpayCredential} credential
 * @returns {Promise<GatewayAccountCredential>}
 */
async function updateOneOffCustomerInitiatedCredentials (serviceExternalId, accountType, credentialId, userExternalId, credential) {
  const patchRequest = new GatewayAccountCredentialUpdateRequest(userExternalId)
    .replace().credentials().oneOffCustomerInitiated(credential.toJson())
  return connectorClient.patchGatewayAccountCredentialsByServiceExternalIdAndAccountType(serviceExternalId, accountType, credentialId, patchRequest)
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {String} credentialId
 * @param {String} userExternalId
 * @param {WorldpayCredential} credential
 * @returns {Promise<GatewayAccountCredential>}
 */
async function updateRecurringCustomerInitiatedCredentials (serviceExternalId, accountType, credentialId, userExternalId, credential) {
  const patchRequest = new GatewayAccountCredentialUpdateRequest(userExternalId)
    .replace().credentials().recurringCustomerInitiated(credential.toJson())
  return connectorClient.patchGatewayAccountCredentialsByServiceExternalIdAndAccountType(serviceExternalId, accountType, credentialId, patchRequest)
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {Worldpay3dsFlexCredential} flexCredential
 * @returns {Promise<undefined>}
 */
async function update3dsFlexCredentials (serviceExternalId, accountType, flexCredential) {
  return connectorClient.put3dsFlexAccountCredentialsByServiceExternalIdAndAccountType(serviceExternalId, accountType, flexCredential)
}

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {Number} integrationVersion3ds
 * @returns {Promise<undefined>}
 */
async function updateIntegrationVersion3ds (serviceExternalId, accountType, integrationVersion3ds) {
  const updateIntegrationVersion3dsRequest = new GatewayAccountUpdateRequest()
    .replace().integrationVersion3ds(integrationVersion3ds)
  return connectorClient.patchGatewayAccountByServiceExternalIdAndAccountType(serviceExternalId, accountType, updateIntegrationVersion3dsRequest)
}

module.exports = {
  checkCredential,
  updateOneOffCustomerInitiatedCredentials,
  check3dsFlexCredential,
  update3dsFlexCredentials,
  updateIntegrationVersion3ds,
  updateRecurringCustomerInitiatedCredentials
}
