import { TransactionBase } from '@models/transaction/TransactionBase.class'
import { LedgerRefundSummary } from '@models/common/refund-summary/LedgerRefundSummary.class'
import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { AuthorisationSummary } from '@models/common/authorisation-summary/AuthorisationSummary.class'
import { CardDetails } from '@models/common/card-details/CardDetails.class'
import { ResourceType } from '@models/transaction/types/resource-type'
import { PaymentData } from '@models/transaction/dto/Payment.dto'

// defines properties present on Payments
export class Payment extends TransactionBase {
  declare readonly data: PaymentData
  readonly transactionType: typeof ResourceType.PAYMENT

  // additional Transaction properties for Payments
  readonly reference: string
  readonly corporateCardSurcharge?: number // pence
  readonly netAmount?: number // pence
  readonly totalAmount?: number // pence
  readonly fee?: number // pence
  readonly description?: string
  readonly paymentProvider?: string
  readonly email?: string
  readonly walletType?: string
  readonly disputed?: boolean
  readonly refundSummary?: LedgerRefundSummary
  readonly authorisationSummary?: AuthorisationSummary
  readonly cardDetails?: CardDetails
  readonly metadata?: Record<string, string>

  // properties never present on Payments
  declare reason: undefined
  declare evidenceDueDate: undefined
  declare paymentDetails: undefined
  declare parentTransactionExternalId: undefined

  constructor(data: PaymentData) {
    super(data)
    this.transactionType = ResourceType.PAYMENT

    this.reference = data.reference
    this.corporateCardSurcharge = data.corporate_card_surcharge
    this.netAmount = data.net_amount
    this.totalAmount = data.total_amount
    this.fee = data.fee
    this.description = data.description
    this.paymentProvider = data.payment_provider
    this.walletType = data.wallet_type
    this.email = data.email
    this.disputed = data.disputed
    this.refundSummary = data.refund_summary && new LedgerRefundSummary(data.refund_summary)
    this.authorisationSummary = data.authorisation_summary && new AuthorisationSummary(data.authorisation_summary)
    this.cardDetails = data.card_details && new CardDetails(data.card_details)
    this.metadata = data.metadata
  }
}
