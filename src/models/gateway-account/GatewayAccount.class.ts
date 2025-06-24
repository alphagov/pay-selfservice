import Worldpay3dsFlexCredential from '@models/gateway-account-credential/Worldpay3dsFlexCredential.class'
import { InvalidConfigurationError, NotFoundError } from '@root/errors'
import CredentialState from '@models/constants/credential-state'
import { GatewayAccountData } from '@models/gateway-account/dto/GatewayAccount.dto'
import { EmailNotificationsData } from '@models/gateway-account/dto/EmailNotifications.dto'
import GatewayAccountCredential from '@models/gateway-account-credential/GatewayAccountCredential.class'
import PaymentProvider from '@models/constants/payment-providers'

const pendingCredentialStates = [CredentialState.CREATED, CredentialState.ENTERED, CredentialState.VERIFIED]

class GatewayAccount {
  readonly id: number
  readonly externalId: string
  readonly type: string
  readonly disabled: boolean
  readonly allowApplePay: boolean
  readonly allowGooglePay: boolean
  readonly allowMoto: boolean
  readonly analyticsId?: string
  readonly description?: string
  readonly disableToggle3ds: boolean
  readonly emailCollectionMode: string
  readonly emailNotifications: EmailNotifications
  readonly gatewayAccountCredentials: GatewayAccountCredential[]
  readonly motoMaskCardNumber: boolean
  readonly motoMaskCardSecurityCode: boolean
  readonly name: string
  readonly paymentProvider: string
  readonly providerSwitchEnabled: boolean
  readonly recurringEnabled: boolean
  readonly requires3ds: boolean
  readonly supports3ds: boolean
  readonly worldpay3dsFlex?: Worldpay3dsFlexCredential
  readonly rawResponse: GatewayAccountData

  constructor(gatewayAccountData: GatewayAccountData) {
    this.id = gatewayAccountData.gateway_account_id
    this.externalId = gatewayAccountData.external_id
    this.type = gatewayAccountData.type
    this.disabled = gatewayAccountData.disabled
    this.allowApplePay = gatewayAccountData.allow_apple_pay
    this.allowGooglePay = gatewayAccountData.allow_google_pay
    this.allowMoto = gatewayAccountData.allow_moto
    this.analyticsId = gatewayAccountData.analytics_id
    this.description = gatewayAccountData.description
    this.disableToggle3ds = gatewayAccountData.payment_provider === PaymentProvider.STRIPE
    this.emailCollectionMode = gatewayAccountData.email_collection_mode
    this.emailNotifications = new EmailNotifications(gatewayAccountData.email_notifications)
    this.gatewayAccountCredentials =
      gatewayAccountData.gateway_account_credentials?.map((credentialData) =>
        GatewayAccountCredential.fromJson(credentialData)
      ) ?? []
    this.motoMaskCardNumber = gatewayAccountData.moto_mask_card_number_input
    this.motoMaskCardSecurityCode = gatewayAccountData.moto_mask_card_security_code_input
    this.name = gatewayAccountData.service_name
    this.paymentProvider = gatewayAccountData.payment_provider
    this.providerSwitchEnabled = gatewayAccountData.provider_switch_enabled
    this.recurringEnabled = gatewayAccountData.recurring_enabled
    this.requires3ds = gatewayAccountData.requires3ds
    this.supports3ds = [PaymentProvider.WORLDPAY, PaymentProvider.STRIPE].includes(gatewayAccountData.payment_provider)
    this.worldpay3dsFlex = gatewayAccountData.worldpay_3ds_flex
      ? Worldpay3dsFlexCredential.fromJson(gatewayAccountData.worldpay_3ds_flex)
      : undefined
    /** @deprecated you should add any rawResponse data as part of the constructor */
    this.rawResponse = gatewayAccountData
  }

  getCurrentCredential() {
    if (this.gatewayAccountCredentials.length === 1) {
      return this.gatewayAccountCredentials[0]
    }
    return this.getActiveCredential()
  }

  getActiveCredential() {
    return this.gatewayAccountCredentials.find((credential) => credential.state === CredentialState.ACTIVE) ?? undefined
  }

  getSwitchingCredential() {
    if (!this.providerSwitchEnabled || !this.getActiveCredential()) {
      throw new InvalidConfigurationError(
        `Requested switching credential from incompatible gateway account [gateway_account_id: ${this.id}]`
      )
    }

    const pendingCredentials = this.gatewayAccountCredentials.filter((credential) =>
      pendingCredentialStates.includes(credential.state)
    )

    if (pendingCredentials.length !== 1) {
      throw new InvalidConfigurationError(
        `Unexpected number of credentials in a pending state for gateway account [found: ${pendingCredentials.length}, gateway_account_id: ${this.id}]`
      )
    }

    return pendingCredentials[0]
  }

  findCredentialByExternalId(externalId: string) {
    const credential = this.gatewayAccountCredentials.find((credential) => credential.externalId === externalId)
    if (!credential) {
      throw new NotFoundError(
        `Credential not found on gateway account [credential_external_id: ${externalId}, gateway_account_id: ${this.id}]`
      )
    }
    return credential
  }

  isSwitchingToProvider(paymentProvider: string): boolean {
    try {
      const switchingCredential = this.getSwitchingCredential()
      return switchingCredential.paymentProvider === paymentProvider
    } catch {
      return false
    }
  }
}

class EmailNotificationSetting {
  readonly enabled: boolean
  readonly templateBody: string
  readonly version: number

  constructor(data: EmailNotificationsData) {
    this.enabled = data?.enabled
    this.templateBody = data?.template_body
    this.version = data?.version
  }
}

class EmailNotifications {
  readonly paymentConfirmed: EmailNotificationSetting
  readonly refundIssued: EmailNotificationSetting

  constructor(data: { PAYMENT_CONFIRMED: EmailNotificationsData; REFUND_ISSUED: EmailNotificationsData }) {
    this.paymentConfirmed = new EmailNotificationSetting(data?.PAYMENT_CONFIRMED)
    this.refundIssued = new EmailNotificationSetting(data?.REFUND_ISSUED)
  }
}

export = GatewayAccount
