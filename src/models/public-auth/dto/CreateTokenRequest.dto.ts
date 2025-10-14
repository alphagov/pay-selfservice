export interface CreateTokenRequestData {
  account_id: string
  service_external_id: string
  service_mode: string
  description: string
  created_by: string
  type: string
  token_account_type?: string
  token_type?: string
}
