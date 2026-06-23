import { TransactionBaseFixture } from '@test/fixtures/transaction/transaction-base.fixture'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { PaymentData } from '@models/transaction/dto/Payment.dto'
import { Payment } from '@models/transaction/Payment.class'
import { ResourceType } from '@models/transaction/types/resource-type'
import { AuthorisationSummaryFixture } from '@test/fixtures/transaction/authorisation-summary.fixture'

export class PaymentFixture extends TransactionBaseFixture {
  readonly transactionType: typeof ResourceType.PAYMENT

  // additional Transaction properties for Payments
  readonly reference: string
  readonly credentialExternalId: string

  declare readonly corporateCardSurcharge?: number // pence
  declare readonly netAmount?: number // pence
  declare readonly totalAmount?: number // pence
  declare readonly fee?: number // pence
  declare readonly description?: string
  declare readonly paymentProvider?: string
  declare readonly email?: string
  declare readonly walletType?: string
  declare readonly disputed?: boolean
  declare readonly refundSummary?: LedgerRefundSummaryFixture
  declare readonly authorisationSummary?: AuthorisationSummaryFixture
  declare readonly cardDetails?: CardDetailsFixture
  declare readonly metadata?: Record<string, string>

  // properties never present on Payments
  declare reason: undefined
  declare evidenceDueDate: undefined
  declare paymentDetails: undefined
  declare parentTransactionExternalId: undefined

  constructor(...options: Partial<PaymentFixture>[]) {
    super(...options)

    this.transactionType = ResourceType.PAYMENT
    this.reference = 'transaction-reference'
    this.credentialExternalId = 'credential-external-123-abc'
  }

  static Success(...options: Partial<PaymentFixture>[]) {
    return new PaymentFixture(
      {
        credentialExternalId: 'credential-external-id-123-abc',
        language: 'en',
        returnUrl: 'https://payments.service.gov.uk',
        description: 'a test transaction',
        paymentProvider: 'sandbox',
        state: TransactionStateFixture.Success(),
        cardDetails: new CardDetailsFixture(),
        disputed: false,
        delayedCapture: false,
        moto: false,
        source: 'API',
        authorisationMode: 'unknown',
        agreementId: 'none',
        refundSummary: new LedgerRefundSummaryFixture(),
      },
      ...options
    )
  }

  toPaymentData(): PaymentData {
    return this.toTransactionData() as PaymentData
  }

  toPayment(): Payment {
    return new Payment(this.toPaymentData())
  }
}
