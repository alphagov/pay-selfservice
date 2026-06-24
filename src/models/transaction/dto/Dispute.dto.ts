import { TransactionBaseData } from '@models/transaction/dto/TransactionBase.dto'
import { PaymentDetailsData } from '@models/transaction/dto/PaymentDetails.dto'

export interface DisputeData extends TransactionBaseData {
  fee?: number
  net_amount?: number
  parent_transaction_id: string
  payment_details: PaymentDetailsData
  evidence_due_date: string
  reason: string
}
