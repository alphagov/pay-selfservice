const { GatewayAccountCredential, CREDENTIAL_STATE } = require('@models/gateway-account-credential/GatewayAccountCredential.class')

/**
 * @class GatewayAccount
 * @property {string} name - The name of the gateway account
 * @property {string} id - The id of the gateway account
 * @property {string} type - The type of the gateway account (e.g. test/live)
 * @property {string} description - The description of the gateway account
 * @property {boolean} allowMoto - whether MOTO payments are enabled on the gateway account
 * @property {string} analyticsId - Google analyticsId of the gateway account
 * @property {boolean} toggle3ds - whether 3DS is enabled or not on this gateway account
 * @property {[GatewayAccountCredential]} gatewayAccountCredentials - available credentials for gateway account
 * @property {GatewayAccountCredential} [activeCredential] - the active credential for the gateway account
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
   * @param {[{Object}]} gatewayAccountData.gateway_account_credentials - whether recurring card payments are enabled on this account
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
    if (gatewayAccountData?.gateway_account_credentials) {
      this.gatewayAccountCredentials = gatewayAccountData?.gateway_account_credentials
        .map(credentialData => new GatewayAccountCredential(credentialData))

      this.activeCredential = this.gatewayAccountCredentials.filter((credential) =>
        credential.state === CREDENTIAL_STATE.ACTIVE)[0] || null
    }
    /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
     * you should instead add any rawResponse data as part of the constructor */
    this.rawResponse = gatewayAccountData
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
