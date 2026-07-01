import { EmailNotificationSettingData } from '@models/gateway-account/dto/EmailNotifications.dto'
import { EmailNotificationSetting } from '@models/gateway-account/EmailNotifications.class'

export class EmailNotificationSettingFixture {
  readonly enabled: boolean
  readonly templateBody: string
  readonly version: number

  constructor(...overrides: Partial<EmailNotificationSettingFixture>[]) {
    this.enabled = true
    this.templateBody = ''
    this.version = 1

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  toEmailNotificationSettingData(): EmailNotificationSettingData {
    return {
      enabled: this.enabled,
      template_body: this.templateBody,
      version: this.version,
    }
  }

  toEmailNotificationSetting(): EmailNotificationSetting {
    return new EmailNotificationSetting(this.toEmailNotificationSettingData())
  }
}
