import { Payment } from '@models/transaction/Payment.class'
import { Refund } from '@models/transaction/Refund.class'
import { Dispute } from '@models/transaction/Dispute.class'
import { PaymentData } from '@models/transaction/dto/Payment.dto'
import { RefundData } from '@models/transaction/dto/Refund.dto'
import { DisputeData } from '@models/transaction/dto/Dispute.dto'
import { ResourceType } from '@models/transaction/types/resource-type'

export type Transaction = Payment | Refund | Dispute

export type TransactionData = PaymentData | RefundData | DisputeData

export const Transaction = {
  fromLedgerResponse: function (data: TransactionData): Transaction {
    switch (data.transaction_type) {
      case ResourceType.PAYMENT:
        return new Payment(data as PaymentData)
      case ResourceType.REFUND:
        return new Refund(data as RefundData)
      case ResourceType.DISPUTE:
        return new Dispute(data as DisputeData)
      default:
        throw new Error('Invalid transaction type')
    }
  },
}
