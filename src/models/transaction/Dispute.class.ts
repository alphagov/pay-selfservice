import { TransactionBase } from '@models/transaction/TransactionBase.class'
import { DisputeData } from '@models/transaction/dto/Dispute.dto'
import { PaymentDetails } from '@models/transaction/PaymentDetails.class'
import { parseReason, Reason } from '@models/transaction/types/reason'
import { DateTime } from 'luxon'
import { RefundData } from '@models/transaction/dto/Refund.dto'
import { ResourceType } from '@models/transaction/types/resource-type'

export class Dispute extends TransactionBase {
  declare readonly data: RefundData
  readonly transactionType: typeof ResourceType.DISPUTE

  readonly fee?: number
  readonly netAmount?: number
  readonly paymentDetails: PaymentDetails
  readonly parentTransactionExternalId: string
  readonly evidenceDueDate: DateTime
  readonly reason: Reason

  // define properties not present on Disputes
  declare reference: undefined
  declare corporateCardSurcharge: undefined
  declare totalAmount: undefined
  declare description: undefined
  declare paymentProvider: undefined
  declare email: undefined
  declare walletType: undefined
  declare disputed: undefined
  declare refundSummary: undefined
  declare authorisationSummary: undefined
  declare cardDetails: undefined
  declare metadata: undefined
  declare refundedBy: undefined
  declare refundedByUserEmail: undefined

  constructor(data: DisputeData) {
    super(data)

    this.fee = data.fee
    this.netAmount = data.net_amount
    this.paymentDetails = new PaymentDetails(data.payment_details)
    this.parentTransactionExternalId = data.parent_transaction_id
    this.evidenceDueDate = DateTime.fromISO(data.evidence_due_date, { zone: 'Europe/London' })
    this.reason = parseReason(data.reason)

    this.transactionType = ResourceType.DISPUTE
  }
}
