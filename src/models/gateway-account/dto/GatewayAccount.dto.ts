import { EmailNotificationsData } from '@models/gateway-account/dto/EmailNotifications.dto'
import { GatewayAccountCredentialData } from '@models/gateway-account-credential/dto/GatewayAccountCredential.dto'
import { Worldpay3dsFlexCredentialData } from '@models/gateway-account-credential/dto/Worldpay3dsFlexCredential.dto'

export interface GatewayAccountData {
  gateway_account_id: number
  external_id: string
  type: string
  disabled: boolean
  allow_apple_pay: boolean
  allow_google_pay: boolean
  allow_moto: boolean
  analytics_id?: string
  description?: string
  payment_provider: string
  gateway_account_credentials?: GatewayAccountCredentialData[]
  email_collection_mode: string
  email_notifications: {
    PAYMENT_CONFIRMED: EmailNotificationsData
    REFUND_ISSUED: EmailNotificationsData
  }
  moto_mask_card_number_input: boolean
  moto_mask_card_security_code_input: boolean
  service_name: string
  service_id: string
  provider_switch_enabled: boolean
  recurring_enabled: boolean
  requires3ds: boolean // 🥴
  toggle_3ds?: boolean
  worldpay_3ds_flex?: Worldpay3dsFlexCredentialData
}
