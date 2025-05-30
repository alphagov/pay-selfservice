export interface ProductData {
  external_id: string
  gateway_account_id: number
  pay_api_token: string
  name: string
  price: number
  status: string
  description: string
  reference_enabled: boolean
  reference_label: string
  reference_hint: string
  amount_hint: string
  type: string
  return_url: string
  language: string
  metadata: Record<string, string>
  require_captcha: boolean
  new_payment_link_journey_enabled: boolean
  _links: {
    href: string
    method: string
    rel: string
  }[]
}
