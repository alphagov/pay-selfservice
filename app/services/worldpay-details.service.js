const { ConnectorClient } = require('./clients/connector.client')
const logger = require('../utils/logger')(__filename)

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {WorldpayCredential} credential
 * @returns {Promise<Object>}
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

module.exports = {
  checkCredential
}
