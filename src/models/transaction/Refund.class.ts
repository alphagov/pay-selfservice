import { TransactionBase } from '@models/transaction/TransactionBase.class'
import { PaymentDetails } from '@models/transaction/PaymentDetails.class'
import { RefundData } from '@models/transaction/dto/Refund.dto'
import { ResourceType } from '@models/transaction/types/resource-type'

// defines properties present or absent on refunds
export class Refund extends TransactionBase {
  declare readonly data: RefundData
  readonly transactionType: typeof ResourceType.REFUND

  readonly paymentDetails: PaymentDetails
  readonly parentTransactionExternalId: string
  readonly refundedBy: string
  readonly refundedByUserEmail: string

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

  constructor(data: RefundData) {
    super(data)

    this.paymentDetails = data.payment_details && new PaymentDetails(data.payment_details)
    this.parentTransactionExternalId = data.parent_transaction_id
    this.refundedBy = data.refunded_by
    this.refundedByUserEmail = data.refunded_by_user_email

    this.transactionType = ResourceType.REFUND
  }
}
