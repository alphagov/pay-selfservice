const { ConnectorClient } = require('./clients/connector.client')
const GatewayAccountCredentialUpdateRequest = require('@models/gateway-account-credential/GatewayAccountCredentialUpdateRequest.class')
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
 * @param {String} credentialId
 * @param {String} userExternalId
 * @param {WorldpayCredential} credential
 * @returns {Promise<GatewayAccountCredential>}
 */
async function updateCredentials (serviceExternalId, accountType, credentialId, userExternalId, credential) {
  const patchRequest = new GatewayAccountCredentialUpdateRequest(userExternalId)
    .replace().credentials().oneOffCustomerInitiated(credential.toJson())
  return connectorClient.patchGatewayAccountCredentialsByServiceExternalIdAndAccountType(serviceExternalId, accountType, credentialId, patchRequest)
}

module.exports = {
  checkCredential,
  updateCredentials
}
