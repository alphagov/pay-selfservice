import { EmailNotificationsData } from '@models/gateway-account/dto/EmailNotifications.dto'
import { EmailNotifications } from '@models/gateway-account/EmailNotifications.class'
import { EmailNotificationSettingFixture } from '@test/fixtures/gateway-account/email-notification-setting.fixture'

export class EmailNotificationFixture {
  readonly paymentConfirmed: EmailNotificationSettingFixture
  readonly refundIssued: EmailNotificationSettingFixture

  constructor(...overrides: Partial<EmailNotificationFixture>[]) {
    this.paymentConfirmed = new EmailNotificationSettingFixture()
    this.refundIssued = new EmailNotificationSettingFixture()

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  toEmailNotificationData(): EmailNotificationsData {
    return {
      PAYMENT_CONFIRMED: this.paymentConfirmed.toEmailNotificationSettingData(),
      REFUND_ISSUED: this.refundIssued.toEmailNotificationSettingData(),
    }
  }

  toEmailNotification(): EmailNotifications {
    return new EmailNotifications(this.toEmailNotificationData())
  }
}
