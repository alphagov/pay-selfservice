import { GatewayAccountCredentialData } from '@models/gateway-account-credential/dto/GatewayAccountCredential.dto'
import GatewayAccountCredential from '@models/gateway-account-credential/GatewayAccountCredential.class'
import { CredentialFixture } from '@test/fixtures/gateway-account/credential.fixture'
import PaymentProviders from '@models/constants/payment-providers'

export class GatewayAccountCredentialFixture {
  public externalId: string
  public paymentProvider: string
  public credentials: CredentialFixture
  public state: string
  public createdDate: string
  public activeStartDate?: string
  public activeEndDate?: string
  public gatewayAccountId!: number

  constructor(...overrides: Partial<GatewayAccountCredentialFixture>[]) {
    this.externalId = 'gateway-account-credential-abc-123'
    this.paymentProvider = 'sandbox'
    this.credentials = CredentialFixture.forSandbox()
    this.state = 'ACTIVE'
    this.createdDate = '2021-01-01T00:00:00.000Z'
    this.activeStartDate = '2021-01-02T00:00:00.000Z'
    this.gatewayAccountId = 1

    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static forStripe(...overrides: Partial<GatewayAccountCredentialFixture>[]) {
    return new GatewayAccountCredentialFixture(
      {
        paymentProvider: PaymentProviders.STRIPE,
        credentials: CredentialFixture.forStripe(),
      },
      ...overrides
    )
  }

  static forSandbox(...overrides: Partial<GatewayAccountCredentialFixture>[]) {
    return new GatewayAccountCredentialFixture(
      {
        paymentProvider: PaymentProviders.SANDBOX,
        credentials: CredentialFixture.forSandbox(),
      },
      ...overrides
    )
  }

  static forWorldpay(...overrides: Partial<GatewayAccountCredentialFixture>[]) {
    return new GatewayAccountCredentialFixture(
      {
        paymentProvider: PaymentProviders.WORLDPAY,
        credentials: CredentialFixture.forWorldpayOneOff(),
      },
      ...overrides
    )
  }

  toGatewayAccountCredentialData(): GatewayAccountCredentialData {
    return {
      external_id: this.externalId,
      payment_provider: this.paymentProvider,
      credentials: this.credentials.toCredentialData(),
      state: this.state,
      created_date: this.createdDate,
      active_start_date: this.activeStartDate,
      active_end_date: this.activeEndDate,
      gateway_account_id: this.gatewayAccountId,
    }
  }

  toGatewayAccountCredential(): GatewayAccountCredential {
    return GatewayAccountCredential.fromJson(this.toGatewayAccountCredentialData())
  }
}
