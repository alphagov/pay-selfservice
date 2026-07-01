import {
  EmailNotificationsData,
  EmailNotificationSettingData,
} from '@models/gateway-account/dto/EmailNotifications.dto'

export class EmailNotificationSetting {
  readonly enabled: boolean
  readonly templateBody: string
  readonly version: number

  constructor(data: EmailNotificationSettingData) {
    this.enabled = data?.enabled
    this.templateBody = data?.template_body
    this.version = data?.version
  }
}

export class EmailNotifications {
  readonly paymentConfirmed: EmailNotificationSetting
  readonly refundIssued: EmailNotificationSetting

  constructor(data: EmailNotificationsData) {
    this.paymentConfirmed = new EmailNotificationSetting(data?.PAYMENT_CONFIRMED)
    this.refundIssued = new EmailNotificationSetting(data?.REFUND_ISSUED)
  }
}
