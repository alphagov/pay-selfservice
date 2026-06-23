import { TransactionBaseFixture } from '@test/fixtures/transaction/transaction-base.fixture'
import { RefundData } from '@models/transaction/dto/Refund.dto'
import { Refund } from '@models/transaction/Refund.class'
import { ResourceType } from '@models/transaction/types/resource-type'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'

export class RefundFixture extends TransactionBaseFixture {
  readonly transactionType: typeof ResourceType.REFUND

  readonly paymentDetails: PaymentDetailsFixture
  readonly parentTransactionExternalId: string
  readonly refundedBy: string
  readonly refundedByUserEmail: string

  constructor(...options: Partial<RefundFixture>[]) {
    super(...options)

    this.externalId = 'refund-external-id-123-abc'
    this.paymentDetails = new PaymentDetailsFixture()
    this.parentTransactionExternalId = 'transaction-external-id-123-abc'
    this.refundedBy = 'user-external-id-123-abc'
    this.refundedByUserEmail = 'mr.refund.issuer@test.example.com'

    this.transactionType = ResourceType.REFUND
  }

  toRefundData(): RefundData {
    return this.toTransactionData() as RefundData
  }

  toRefund(): Refund {
    return new Refund(this.toRefundData())
  }

  // define properties not present on Refunds
  declare reference: undefined
  declare corporateCardSurcharge: undefined
  declare netAmount: undefined
  declare totalAmount: undefined
  declare fee: undefined
  declare description: undefined
  declare paymentProvider: undefined
  declare email: undefined
  declare walletType: undefined
  declare disputed: undefined
  declare refundSummary: undefined
  declare authorisationSummary: undefined
  declare cardDetails: undefined
  declare reason: undefined
  declare evidenceDueDate: undefined
  declare metadata: undefined
}
