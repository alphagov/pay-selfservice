import { WorldpayCredentialData } from '@models/gateway-account-credential/dto/WorldpayCredential.dto'

export interface CredentialData {
  stripe_account_id: string
  one_off_customer_initiated: WorldpayCredentialData
  recurring_customer_initiated: WorldpayCredentialData
  recurring_merchant_initiated: WorldpayCredentialData
  gateway_merchant_id: string
}
