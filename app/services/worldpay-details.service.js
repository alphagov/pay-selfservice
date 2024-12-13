const { ConnectorClient } = require('./clients/connector.client')
const logger = require('../utils/logger')(__filename)

const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)

/**
 *
 * @param {String} serviceExternalId
 * @param {String} accountType
 * @param {WorldpayCredential} credential
 * @returns {Promise}
 */
async function checkCredential (serviceExternalId, accountType, credential) {
  console.log(credential.toJson())
  const credentialCheck = await connectorClient.postCheckWorldpayCredentialByServiceExternalIdAndAccountType(
    serviceExternalId,
    accountType,
    credential.toJson()
  )
  if (credentialCheck.result !== 'valid') {
    logger.warn('Provided credentials failed validation with Worldpay')
    throw new Error('Invalid credentials')
  }

  logger.info('Successfully validated credentials with Worldpay')
}

module.exports = {
  checkCredential
}
