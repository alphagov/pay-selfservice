export interface EmailNotificationsData {
  PAYMENT_CONFIRMED: EmailNotificationSettingData
  REFUND_ISSUED: EmailNotificationSettingData
}

export interface EmailNotificationSettingData {
  enabled: boolean
  template_body: string
  version: number
}
