interface ServiceNameData {
  en: string
  cy: string
}

interface MerchantDetailsData {
  name: string
  telephone_number: string
  address_line1: string
  address_line2: string
  address_city: string
  address_postcode: string
  address_country: string
  url: string
  email: string
}

interface ServiceData {
  id: number
  external_id: string
  name: string
  service_name: ServiceNameData
  gateway_account_ids: string[]
  merchant_details?: MerchantDetailsData
  collect_billing_address: boolean
  current_go_live_stage: string
  experimental_features_enabled: boolean
  created_date: string
  current_psp_test_account_stage: string
  agent_initiated_moto_enabled: boolean
  default_billing_address_country: string
  takes_payments_over_phone: boolean
}

export = ServiceData
