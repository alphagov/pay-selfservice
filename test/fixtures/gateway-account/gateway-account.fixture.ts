import { GatewayAccountData } from '@models/gateway-account/dto/GatewayAccount.dto'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { GatewayAccountCredentialFixture } from '@test/fixtures/gateway-account/gateway-account-credential.fixture'
import { Worldpay3dsFlexCredentialFixture } from '@test/fixtures/gateway-account/worldpay-3ds-flex-credential.fixture'
import { EmailNotificationFixture } from '@test/fixtures/gateway-account/email-notification.fixture'
import { GatewayAccountType } from '@models/gateway-account/gateway-account-type'
import PaymentProviders from '@models/constants/payment-providers'

export class GatewayAccountFixture {
  readonly id: number
  readonly externalId: string
  readonly type: GatewayAccountType
  readonly disabled: boolean
  readonly allowApplePay: boolean
  readonly allowGooglePay: boolean
  readonly allowMoto: boolean
  readonly analyticsId?: string
  readonly description?: string
  readonly disableToggle3ds: boolean
  readonly emailCollectionMode: string
  readonly emailNotifications: EmailNotificationFixture
  readonly gatewayAccountCredentials: GatewayAccountCredentialFixture[]
  readonly motoMaskCardNumber: boolean
  readonly motoMaskCardSecurityCode: boolean
  readonly name: string
  readonly paymentProvider: string
  readonly providerSwitchEnabled: boolean
  readonly recurringEnabled: boolean
  readonly requires3ds: boolean
  readonly supports3ds: boolean
  readonly worldpay3dsFlex?: Worldpay3dsFlexCredentialFixture
  readonly sendPayerEmailToGateway: boolean
  readonly sendPayerIPAddressToGateway: boolean
  readonly serviceId?: string
  readonly serviceName: string

  constructor(...overrides: Partial<GatewayAccountFixture>[]) {
    this.id = 1
    this.externalId = 'gateway-account-123-abc'
    this.type = 'test'
    this.disabled = false
    this.allowApplePay = false
    this.allowGooglePay = false
    this.allowMoto = false
    this.description = 'A test gateway account'
    this.disableToggle3ds = false
    this.emailCollectionMode = 'OFF'
    this.emailNotifications = new EmailNotificationFixture()
    this.gatewayAccountCredentials = [GatewayAccountCredentialFixture.forSandbox()]
    this.motoMaskCardNumber = false
    this.motoMaskCardSecurityCode = false
    this.name = 'Test Account'
    this.paymentProvider = PaymentProviders.SANDBOX
    this.providerSwitchEnabled = false
    this.recurringEnabled = false
    this.requires3ds = false
    this.supports3ds = false
    this.sendPayerEmailToGateway = false
    this.sendPayerIPAddressToGateway = false
    this.serviceName = 'A test service'

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static forStripe(...overrides: Partial<GatewayAccountFixture>[]) {
    return new GatewayAccountFixture(
      {
        paymentProvider: PaymentProviders.STRIPE,
        gatewayAccountCredentials: [GatewayAccountCredentialFixture.forStripe()],
      },
      ...overrides
    )
  }

  static forWorldpay(...overrides: Partial<GatewayAccountFixture>[]) {
    return new GatewayAccountFixture(
      {
        paymentProvider: PaymentProviders.WORLDPAY,
        gatewayAccountCredentials: [GatewayAccountCredentialFixture.forWorldpay()],
      },
      ...overrides
    )
  }

  static forSandbox(...overrides: Partial<GatewayAccountFixture>[]) {
    return new GatewayAccountFixture(...overrides)
  }

  toGatewayAccountData(): GatewayAccountData {
    return {
      gateway_account_id: this.id,
      external_id: this.externalId,
      type: this.type,
      disabled: this.disabled,
      allow_apple_pay: this.allowApplePay,
      allow_google_pay: this.allowGooglePay,
      allow_moto: this.allowMoto,
      analytics_id: this.analyticsId,
      description: this.description,
      payment_provider: this.paymentProvider,
      gateway_account_credentials: this.gatewayAccountCredentials.map((credential) =>
        credential.toGatewayAccountCredentialData()
      ),
      email_collection_mode: this.emailCollectionMode,
      email_notifications: this.emailNotifications.toEmailNotificationData(),
      moto_mask_card_number_input: this.motoMaskCardNumber,
      moto_mask_card_security_code_input: this.motoMaskCardSecurityCode,
      service_name: this.serviceName,
      provider_switch_enabled: this.providerSwitchEnabled,
      recurring_enabled: this.recurringEnabled,
      requires3ds: this.requires3ds,
      toggle_3ds: this.disableToggle3ds,
      worldpay_3ds_flex: this.worldpay3dsFlex?.toWorldpay3dsFlexCredentialData(),
      send_payer_email_to_gateway: this.sendPayerEmailToGateway,
      send_payer_ip_address_to_gateway: this.sendPayerIPAddressToGateway,
      service_id: this.serviceId,
    }
  }

  toGatewayAccount(): GatewayAccount {
    return new GatewayAccount(this.toGatewayAccountData())
  }
}
