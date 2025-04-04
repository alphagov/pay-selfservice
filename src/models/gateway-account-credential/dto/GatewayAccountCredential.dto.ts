import { CredentialData } from '@models/gateway-account-credential/dto/Credential.dto'

export interface GatewayAccountCredentialData {
  external_id: string
  payment_provider: string
  credentials: CredentialData
  state: string
  created_date: string
  active_start_date: string
  active_end_date: string
  gateway_account_id: number
}
