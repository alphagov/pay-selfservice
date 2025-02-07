const { GatewayAccountCredential } = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const CREDENTIAL_STATE = require('@models/credential-state')
const Worldpay3dsFlexCredential = require('@models/gateway-account-credential/Worldpay3dsFlexCredential.class')
const { InvalidConfigurationError } = require('@root/errors')
const pendingCredentialStates = [CREDENTIAL_STATE.CREATED, CREDENTIAL_STATE.ENTERED, CREDENTIAL_STATE.VERIFIED]

/**
 * @class GatewayAccount
 * @property {string} name - The name of the gateway account
 * @property {string} id - The id of the gateway account
 * @property {string} type - The type of the gateway account (e.g. test/live)
 * @property {string} paymentProvider - The payment provider for the gateway account (e.g. stripe/worldpay)
 * @property {string} description - The description of the gateway account
 * @property {boolean} allowMoto - whether MOTO payments are enabled on the gateway account
 * @property {string} analyticsId - Google analyticsId of the gateway account
 * @property {boolean} toggle3ds - whether 3DS is enabled or not on this gateway account
 * @property {[GatewayAccountCredential]} gatewayAccountCredentials - available credentials for gateway account
 * @property {bool} allowApplePay - whether the gateway has Apple Pay enabled or not
 * @property {bool} allowGooglePay - whether the gateway has Google Pay enabled or not
 * @property {Object} rawResponse - raw 'gateway account' object
 */
class GatewayAccount {
  /**
   * Create an instance of GatewayAccount
   * @param {Object} gatewayAccountData - raw 'gateway account' object from server
   * @param {string} gatewayAccountData.gateway_account_id - The ID of the gateway account
   * @param {string} gatewayAccountData.external_id - The external ID of the gateway account
   * @param {string} gatewayAccountData.service_name - The name of the gateway account
   * @param {string} gatewayAccountData.type - The type of the gateway account
   * @param {string} gatewayAccountData.payment_provider - The payment provider of the gateway account
   * @param {string} gatewayAccountData.description - The description of the gateway account
   * @param {boolean} gatewayAccountData.allow_moto - whether MOTO payments are enabled on the gateway account
   * @param {string} gatewayAccountData.analytics_id - Google analytics_id of the gateway account
   * @param {boolean} gatewayAccountData.toggle_3ds - whether 3DS is enabled or not on this gateway account
   * @param {boolean} gatewayAccountData.provider_switch_enabled - indicates that the gateway is transitioning psp
   * @param {boolean} gatewayAccountData.recurring_enabled - whether recurring card payments are enabled on this account
   * @param {[{Object}]} gatewayAccountData.gateway_account_credentials - credentials present for the gateway account
   * @param {boolean} gatewayAccountData.allow_google_pay - whether google pay is enabled on this account
   * @param {boolean} gatewayAccountData.allow_apple_pay - whether apple pay is enabled on this account
   * @param {Object} [gatewayAccountData.worldpay_3ds_flex] - 3ds flex credentials and metadata for Worldpay
   **/
  constructor (gatewayAccountData) {
    this.id = gatewayAccountData.gateway_account_id
    this.externalId = gatewayAccountData.external_id
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
    /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
     * you should instead add any rawResponse data as part of the constructor */
    this.rawResponse = gatewayAccountData
  }

  /**
   *
   * @returns {GatewayAccountCredential}
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
   * @returns {GatewayAccountCredential}
   */
  getSwitchingCredentialIfPresent () {
    // service must have an active credential to be 'switching' from
    if (this.getActiveCredential()) {
      const pendingCredentials = this.gatewayAccountCredentials
        .filter((credential) => pendingCredentialStates.includes(credential.state))
      // service must have exactly one credential in a pending state
      if (pendingCredentials.length > 1) {
        throw new InvalidConfigurationError(`Unexpected number of credentials in a pending state for gateway account [found ${pendingCredentials.length}]`)
      }
      if (pendingCredentials.length === 1) {
        return pendingCredentials[0]
      }
      return null
    }
    return null
  }

  /**
   * @method toJson
   * @returns {Object} A minimal representation of the gateway account
   */
  toMinimalJson () {
    // until we have external ids for card accounts, the external id is the internal one
    return {
      id: this.id,
      external_id: this.externalId,
      payment_provider: this.paymentProvider,
      service_name: this.name,
      type: this.type,
      provider_switch_enabled: this.providerSwitchEnabled,
      recurring_enabled: this.recurringEnabled
    }
  }
}

module.exports = GatewayAccount
