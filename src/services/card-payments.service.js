const { ConnectorClient } = require('@services/clients/connector.client')
const getAdminUsersClient = require('@services/clients/adminusers.client')
const GatewayAccountUpdateRequest = require('@models/gateway-account/GatewayAccountUpdateRequest.class')
const connectorClient = new ConnectorClient(process.env.CONNECTOR_URL)
const adminUsersClient = getAdminUsersClient()

/**
 * @param serviceExternalId {string}
 * @param accountType {string}
 * @param allowApplePay {boolean}
 * @returns {Promise<void>}
 */
const updateAllowApplePay = (serviceExternalId, accountType, allowApplePay) => {
  const updateAllowApplePayRequest = new GatewayAccountUpdateRequest()
    .replace()
    .allowApplePay(allowApplePay)
  return connectorClient.patchGatewayAccountByServiceExternalIdAndAccountType(serviceExternalId, accountType, updateAllowApplePayRequest)
}

/**
 * @param serviceExternalId {string}
 * @param accountType {string}
 * @param allowGooglePay {boolean}
 * @returns {Promise<void>}
 */
const updateAllowGooglePay = (serviceExternalId, accountType, allowGooglePay) => {
  const updateAllowGooglePayRequest = new GatewayAccountUpdateRequest()
    .replace()
    .allowGooglePay(allowGooglePay)
  return connectorClient.patchGatewayAccountByServiceExternalIdAndAccountType(serviceExternalId, accountType, updateAllowGooglePayRequest)
}

/**
 * @param serviceExternalId {string}
 * @param accountType {string}
 * @param maskCardNumber {boolean}
 * @returns {Promise<void>}
 */
const updateMotoMaskCardNumber = (serviceExternalId, accountType, maskCardNumber) => {
  const updateMotoMaskCardNumberRequest = new GatewayAccountUpdateRequest()
    .replace()
    .motoMaskCardNumber(maskCardNumber)
  return connectorClient.patchGatewayAccountByServiceExternalIdAndAccountType(serviceExternalId, accountType, updateMotoMaskCardNumberRequest)
}

/**
 * @param serviceExternalId {string}
 * @param accountType {string}
 * @param maskSecurityCode {boolean}
 * @returns {Promise<void>}
 */
const updateMotoMaskSecurityCode = (serviceExternalId, accountType, maskSecurityCode) => {
  const updateMotoMaskSecurityCodeRequest = new GatewayAccountUpdateRequest()
    .replace()
    .motoMaskSecurityCode(maskSecurityCode)
  return connectorClient.patchGatewayAccountByServiceExternalIdAndAccountType(serviceExternalId, accountType, updateMotoMaskSecurityCodeRequest)
}

module.exports = {
  updateAllowApplePay,
  updateAllowGooglePay,
  updateMotoMaskCardNumber,
  updateMotoMaskSecurityCode,
  updateCollectBillingAddress: adminUsersClient.updateCollectBillingAddress,
  updateDefaultBillingAddressCountry: adminUsersClient.updateDefaultBillingAddressCountry
}
