import { CredentialData } from '@models/gateway-account-credential/dto/Credential.dto'
import Credential from '@models/gateway-account-credential/Credential.class'
import { WorldpayCredentialFixture } from '@test/fixtures/gateway-account/worldpay-credential.fixture'

export class CredentialFixture {
  public stripeAccountId?: string
  public oneOffCustomerInitiated?: WorldpayCredentialFixture
  public recurringCustomerInitiated?: WorldpayCredentialFixture
  public recurringMerchantInitiated?: WorldpayCredentialFixture
  public googlePayMerchantId?: string

  constructor(...overrides: Partial<CredentialFixture>[]) {
    overrides.forEach((override) => {
      Object.assign(this, override)
    })
  }

  static forStripe() {
    return new CredentialFixture({
      stripeAccountId: 'a-stripe-account',
    })
  }

  static forWorldpayOneOff() {
    return new CredentialFixture({
      oneOffCustomerInitiated: new WorldpayCredentialFixture(),
    })
  }

  static forWorldpayMoto() {
    return new CredentialFixture({
      oneOffCustomerInitiated: WorldpayCredentialFixture.forMoto(),
    })
  }

  static forSandbox() {
    return new CredentialFixture()
  }

  toCredentialData(): CredentialData {
    return {
      stripe_account_id: this.stripeAccountId,
      one_off_customer_initiated: this.oneOffCustomerInitiated?.toWorldpayCredentialData(),
      recurring_customer_initiated: this.recurringCustomerInitiated?.toWorldpayCredentialData(),
      recurring_merchant_initiated: this.recurringMerchantInitiated?.toWorldpayCredentialData(),
      gateway_merchant_id: this.googlePayMerchantId,
    }
  }

  toCredential(): Credential {
    return Credential.fromJson(this.toCredentialData())
  }
}
