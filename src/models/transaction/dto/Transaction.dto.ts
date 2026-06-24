import { PaymentData } from '@models/transaction/dto/Payment.dto'
import { RefundData } from '@models/transaction/dto/Refund.dto'
import { DisputeData } from '@models/transaction/dto/Dispute.dto'

export type TransactionData = PaymentData | RefundData | DisputeData
