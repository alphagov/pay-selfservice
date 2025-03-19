const MerchantDetails = require('@models/service/MerchantDetails.class')

/**
 * @class GOVUKPayService
 * @property {string} id  - The id of the service
 * @property {string} externalId  - The external id of the service
 * @property {string} currentGoLiveStage  - Live stage of the service
 * @property {string} name  - English name of service
 * @property {{
 *   en: string,
 *   cy: string
 * }} serviceName - object containing english and welsh service names
 * @property {[string]} gatewayAccountIds - gateway account ids associated with service
 * @property {MerchantDetails} merchantDetails - the organisation details for the service
 * @property {boolean} collectBillingAddress -
 * @property {GO_LIVE_STAGE} currentGoLiveStage -
 * @property {boolean} experimentalFeaturesEnabled - whether experimental features are disabled for the service
 * @property {string} createdDate
 * @property {PSP_TEST_ACCOUNT_STAGE} currentPspTestAccountStage
 * @property {boolean} agentInitiatedMotoEnabled
 * @property {string} defaultBillingAddressCountry
 * @property {boolean} takesPaymentsOverPhone
 */
class Service {
  constructor (serviceData) {
    this.id = serviceData.id
    this.externalId = serviceData.external_id
    this.name = serviceData.name
    this.serviceName = serviceData.service_name
    this.gatewayAccountIds = serviceData.gateway_account_ids
    this.merchantDetails = serviceData.merchant_details && MerchantDetails.fromJson(serviceData.merchant_details)
    this.collectBillingAddress = serviceData.collect_billing_address
    this.currentGoLiveStage = serviceData.current_go_live_stage
    this.experimentalFeaturesEnabled = serviceData.experimental_features_enabled
    this.createdDate = serviceData.created_date
    this.currentPspTestAccountStage = serviceData.current_psp_test_account_stage
    this.agentInitiatedMotoEnabled = serviceData.agent_initiated_moto_enabled
    this.defaultBillingAddressCountry = serviceData.default_billing_address_country
    this.takesPaymentsOverPhone = serviceData.takes_payments_over_phone
  }

  /**
   * @method toJson
   * @returns {Object} An 'adminusers' compatible representation of the service
   */
  toJson () {
    return {
      id: this.id,
      external_id: this.externalId,
      name: this.name,
      serviceName: this.serviceName,
      gateway_account_ids: this.gatewayAccountIds,
      merchant_details: this.merchantDetails?.toJson(),
      collect_billing_address: this.collectBillingAddress,
      current_go_live_stage: this.currentGoLiveStage,
      experimental_features_enabled: this.experimentalFeaturesEnabled,
      created_date: this.createdDate,
      current_psp_test_account_stage: this.currentPspTestAccountStage,
      agent_initiated_moto_enabled: this.agentInitiatedMotoEnabled,
      default_billing_address_country: this.defaultBillingAddressCountry,
      takes_payments_over_phone: this.takesPaymentsOverPhone
    }
  }
}

module.exports = Service
