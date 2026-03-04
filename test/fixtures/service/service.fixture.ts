import { ServiceData } from '@models/service/dto/Service.dto'
import Service from '@models/service/Service.class'
import { MerchantDetailsFixture } from '@test/fixtures/service/merchant-details.fixture'

export class ServiceFixture {
  readonly id: number
  readonly externalId: string
  readonly name: string
  readonly serviceName: { en: string; cy?: string }
  readonly gatewayAccountIds: string[]
  readonly merchantDetails?: MerchantDetailsFixture
  readonly collectBillingAddress: boolean
  readonly currentGoLiveStage: string
  readonly experimentalFeaturesEnabled: boolean
  readonly createdDate: string
  readonly currentPspTestAccountStage: string
  readonly agentInitiatedMotoEnabled: boolean
  readonly defaultBillingAddressCountry?: string
  readonly takesPaymentsOverPhone: boolean

  constructor(overrides?: Partial<ServiceFixture>) {
    this.id = 1
    this.externalId = 'service-external-id-123-abc'
    this.name = 'Power Plant Safety Inspection'
    this.serviceName = {
      en: 'Power Plant Safety Inspection',
    }
    this.gatewayAccountIds = ['100']
    this.collectBillingAddress = true
    this.currentGoLiveStage = 'NOT_STARTED'
    this.experimentalFeaturesEnabled = false
    this.createdDate = '2025-01-01T12:00:00'
    this.currentPspTestAccountStage = ''
    this.agentInitiatedMotoEnabled = false
    this.takesPaymentsOverPhone = false

    if (overrides) {
      Object.assign(this, overrides)
    }
  }

  toServiceData(): ServiceData {
    return {
      id: this.id,
      external_id: this.externalId,
      name: this.name,
      service_name: this.serviceName,
      gateway_account_ids: this.gatewayAccountIds,
      merchant_details: this.merchantDetails?.toMerchantDetailsData(),
      collect_billing_address: this.collectBillingAddress,
      current_go_live_stage: this.currentGoLiveStage,
      experimental_features_enabled: this.experimentalFeaturesEnabled,
      created_date: this.createdDate,
      current_psp_test_account_stage: this.currentPspTestAccountStage,
      agent_initiated_moto_enabled: this.agentInitiatedMotoEnabled,
      default_billing_address_country: this.defaultBillingAddressCountry,
      takes_payments_over_phone: this.takesPaymentsOverPhone,
    }
  }

  toService(): Service {
    return new Service(this.toServiceData())
  }
}
