import ServiceData from '@models/service/dto/Service.dto'

class Service {
  readonly id: number
  readonly externalId: string
  readonly name: string
  readonly serviceName: { en: string, cy?: string }
  gatewayAccountIds: string[]
  readonly merchantDetails?: {
    name: string
    telephoneNumber: string
    addressLine1: string
    addressLine2: string
    addressCity: string
    addressPostcode: string
    addressCountry: string
    url: string,
    email: string
  }
  readonly collectBillingAddress: boolean
  readonly currentGoLiveStage: string
  readonly experimentalFeaturesEnabled: boolean
  readonly createdDate: string
  readonly currentPspTestAccountStage: string
  readonly agentInitiatedMotoEnabled: boolean
  readonly defaultBillingAddressCountry: string
  readonly takesPaymentsOverPhone: boolean

  constructor(serviceData: ServiceData) {
    this.id = serviceData.id
    this.externalId = serviceData.external_id
    this.name = serviceData.name
    this.serviceName = {
      en: serviceData.service_name.en,
      cy: serviceData.service_name.cy,
    }
    this.gatewayAccountIds = serviceData.gateway_account_ids
    this.merchantDetails = serviceData.merchant_details
      ? {
          name: serviceData.merchant_details.name,
          telephoneNumber: serviceData.merchant_details.telephone_number,
          addressLine1: serviceData.merchant_details.address_line1,
          addressLine2: serviceData.merchant_details.address_line2,
          addressCity: serviceData.merchant_details.address_city,
          addressPostcode: serviceData.merchant_details.address_postcode,
          addressCountry: serviceData.merchant_details.address_country,
          url: serviceData.merchant_details.url,
          email: serviceData.merchant_details.email,
        }
      : undefined
    this.collectBillingAddress = serviceData.collect_billing_address
    this.currentGoLiveStage = serviceData.current_go_live_stage
    this.experimentalFeaturesEnabled = serviceData.experimental_features_enabled
    this.createdDate = serviceData.created_date
    this.currentPspTestAccountStage = serviceData.current_psp_test_account_stage
    this.agentInitiatedMotoEnabled = serviceData.agent_initiated_moto_enabled
    this.defaultBillingAddressCountry = serviceData.default_billing_address_country
    this.takesPaymentsOverPhone = serviceData.takes_payments_over_phone
  }
}

export = Service
