import { CredentialData } from '@models/gateway-account-credential/dto/Credential.dto'
import WorldpayCredential from '@models/gateway-account-credential/WorldpayCredential.class'

class Credential {
  public stripeAccountId?: string
  public oneOffCustomerInitiated?: WorldpayCredential
  public recurringCustomerInitiated?: WorldpayCredential
  public recurringMerchantInitiated?: WorldpayCredential
  public googlePayMerchantId?: string
  public rawResponse?: CredentialData

  withStripeAccountId(stripeAccountId: string) {
    this.stripeAccountId = stripeAccountId
    return this
  }

  withOneOffCustomerInitiated(oneOffCustomerInitiated: WorldpayCredential) {
    this.oneOffCustomerInitiated = oneOffCustomerInitiated
    return this
  }

  withRecurringCustomerInitiated(recurringCustomerInitiated: WorldpayCredential) {
    this.recurringCustomerInitiated = recurringCustomerInitiated
    return this
  }

  withRecurringMerchantInitiated(recurringMerchantInitiated: WorldpayCredential) {
    this.recurringMerchantInitiated = recurringMerchantInitiated
    return this
  }

  withGooglePayMerchantId(googlePayMerchantId: string) {
    this.googlePayMerchantId = googlePayMerchantId
    return this
  }

  /** @deprecated this is a temporary compatability fix! If you find yourself using this for new code
   * you should instead add any rawResponse data as part of the constructor */
  withRawResponse(data: CredentialData) {
    this.rawResponse = data
    return this
  }

  static fromJson(data: CredentialData) {
    const credential = new Credential().withRawResponse(data)
    if (data?.stripe_account_id) {
      credential.withStripeAccountId(data.stripe_account_id)
    }
    if (data?.one_off_customer_initiated) {
      credential.withOneOffCustomerInitiated(WorldpayCredential.fromJson(data.one_off_customer_initiated))
    }
    if (data?.recurring_customer_initiated) {
      credential.withRecurringCustomerInitiated(WorldpayCredential.fromJson(data.recurring_customer_initiated))
    }
    if (data?.recurring_merchant_initiated) {
      credential.withRecurringMerchantInitiated(WorldpayCredential.fromJson(data.recurring_merchant_initiated))
    }
    if (data?.gateway_merchant_id) {
      credential.withGooglePayMerchantId(data.gateway_merchant_id)
    }
    return credential
  }
}

export = Credential
