export interface CreateProductRequestData {
  gateway_account_id: number
  pay_api_token: string
  name: string
  description: string
  price: number
  type: string
  return_url?: string
  service_name_path?: string
  product_name_path?: string
}
