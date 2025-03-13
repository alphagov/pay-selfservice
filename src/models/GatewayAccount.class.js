const { GatewayAccountCredential } = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const CREDENTIAL_STATE = require('@models/constants/credential-state')
const Worldpay3dsFlexCredential = require('@models/gateway-account-credential/Worldpay3dsFlexCredential.class')
const { InvalidConfigurationError } = require('@root/errors')
const pendingCredentialStates = [CREDENTIAL_STATE.CREATED, CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED]

/**
 * @class GatewayAccount
 * Represents a gateway account
 * @property {string} id The id of the gateway account
 * @property {string} externalId The external id of the gateway account
 * @property {string} name The name of the gateway account
 * @property {string} type The type of the gateway account (e.g. test/live)
 * @property {string} paymentProvider The payment provider for the gateway account (e.g. stripe/worldpay)
 * @property {string} description The description of the gateway account
 * @property {boolean} allowMoto whether MOTO payments are enabled on the gateway account
 * @property {string} analyticsId Google analyticsId of the gateway account
 * @property {boolean} toggle3ds whether 3DS is enabled or not on this gateway account
 * @property {boolean} providerSwitchEnabled whether provider switching is enabled on this gateway account
 * @property {boolean} recurringEnabled whether recurring payments are enabled on this gateway account
 * @property {GatewayAccountCredential[]} gatewayAccountCredentials available credentials for gateway account
 * @property {Worldpay3dsFlexCredential} worldpay3dsFlex available credentials for gateway account
 * @property {boolean} supports3ds
 * @property {boolean} disableToggle3ds
 * @property {boolean} requires3ds
 * @property {boolean} allowApplePay whether the gateway has Apple Pay enabled or not
 * @property {boolean} allowGooglePay whether the gateway has Google Pay enabled or not
 * @property {Object} rawResponse raw 'gateway account' object
 */
class GatewayAccount {
  constructor (gatewayAccountData) {
    this.id = gatewayAccountData.gateway_account_id
    this.externalId = gatewayAccountData.external_id
    this.emailCollectionMode = gatewayAccountData.email_collection_mode
    this.name = gatewayAccountData.service_name
    this.type = gatewayAccountData.type
    this.paymentProvider = gatewayAccountData.payment_provider
    this.description = gatewayAccountData.description
    this.allowMoto = gatewayAccountData.allow_moto
    this.analyticsId = gatewayAccountData.analytics_id
    this.toggle3ds = gatewayAccountData.toggle_3ds
    this.providerSwitchEnabled = gatewayAccountData.provider_switch_enabled
    this.recurringEnabled = gatewayAccountData.recurring_enabled
    this.gatewayAccountCredentials = gatewayAccountData?.gateway_account_credentials?.map(
      credentialData => GatewayAccountCredential.fromJson(credentialData)
    ) ?? []
    if (gatewayAccountData?.worldpay_3ds_flex) {
      this.worldpay3dsFlex = Worldpay3dsFlexCredential.fromJson(gatewayAccountData.worldpay_3ds_flex)
    }
    this.supports3ds = ['worldpay', 'stripe'].includes(gatewayAccountData.payment_provider)
    this.disableToggle3ds = gatewayAccountData.payment_provider === 'stripe'
    this.requires3ds = gatewayAccountData.requires3ds
    this.allowGooglePay = gatewayAccountData.allow_google_pay
    this.allowApplePay = gatewayAccountData.allow_apple_pay
    this.motoMaskCardNumber = gatewayAccountData.moto_mask_card_number_input
    this.motoMaskCardSecurityCode = gatewayAccountData.moto_mask_card_security_code_input
    /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
     * you should instead add any rawResponse data as part of the constructor */
    this.rawResponse = gatewayAccountData
  }

  /**
   * @returns {GatewayAccountCredential} The current credential
   */
  getCurrentCredential () {
    if (this.gatewayAccountCredentials.length === 1) {
      return this.gatewayAccountCredentials[0]
    }
    return this.getActiveCredential()
  }

  /**
   *
   * @returns {GatewayAccountCredential}
   */
  getActiveCredential () {
    return this.gatewayAccountCredentials
      .filter((credential) => credential.state === CREDENTIAL_STATE.ACTIVE)[0] || null
  }

  /**
   * Returns exactly one credential in a pending state
   * @returns {GatewayAccountCredential} The switching credential
   * @throws {InvalidConfigurationError} When there isn't exactly one pending credential
   */
  getSwitchingCredential () {
    if (!this.providerSwitchEnabled || !this.getActiveCredential()) {
      throw new InvalidConfigurationError(
        `Requested switching credential from incompatible gateway account [gateway_account_id: ${this.id}]`
      )
    }

    const pendingCredentials = this.gatewayAccountCredentials
      .filter(credential => pendingCredentialStates.includes(credential.state))

    if (pendingCredentials.length !== 1) {
      throw new InvalidConfigurationError(
        `Unexpected number of credentials in a pending state for gateway account [found: ${pendingCredentials.length}, gateway_account_id: ${this.id}]`
      )
    }

    return pendingCredentials[0]
  }

  isSwitchingToProvider (paymentProvider) {
    try {
      const switchingCredential = this.getSwitchingCredential()
      return switchingCredential.paymentProvider === paymentProvider
    } catch {
      return false
    }
  }
}

module.exports = GatewayAccount
