import { TransactionBaseData } from '@models/transaction/dto/TransactionBase.dto'
import { StateData } from '@models/transaction/dto/State.dto'
import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'
import { LedgerRefundSummaryData } from '@models/common/refund-summary/dto/LedgerRefundSummary.dto'
import { AuthorisationSummaryData } from '@models/common/authorisation-summary/dto/AuthorisationSummary.dto'
import { ResourceType } from '@models/transaction/types/resource-type'

export interface PaymentData extends TransactionBaseData {
  gateway_account_id: string
  service_id: string
  credential_external_id: string
  amount: number
  net_amount?: number
  total_amount?: number
  corporate_card_surcharge?: number
  fee?: number
  state: StateData
  description: string
  reference: string
  language: string
  return_url: string
  email?: string
  payment_provider: string
  created_date: string
  card_details?: CardDetailsData
  delayed_capture: boolean
  gateway_transaction_id: string
  refund_summary: LedgerRefundSummaryData
  authorisation_summary?: AuthorisationSummaryData
  transaction_type: typeof ResourceType.PAYMENT
  wallet_type?: string
  moto: boolean
  source: string
  authorisation_mode: string
  agreement_id?: string
  disputed: boolean
  transaction_id: string
  metadata?: Record<string, string>
}
