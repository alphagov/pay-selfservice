import { TransactionBaseData } from '@models/transaction/dto/TransactionBase.dto'
import { PaymentDetailsData } from '@models/transaction/dto/PaymentDetails.dto'

export interface RefundData extends TransactionBaseData {
  refunded_by: string
  refunded_by_user_email: string
  parent_transaction_id: string
  payment_details: PaymentDetailsData
}
