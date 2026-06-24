import { AuthorisationSummaryData } from '@models/common/authorisation-summary/dto/AuthorisationSummary.dto'
import { SettlementSummaryData } from '@models/common/settlement-summary/dto/SettlementSummary.dto'
import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'
import { LedgerRefundSummaryData } from '@models/common/refund-summary/dto/LedgerRefundSummary.dto'
import { ResourceType } from '../types/resource-type'
import { StateData } from './State.dto'
import { PaymentDetailsData } from '@models/transaction/dto/PaymentDetails.dto'

export interface TransactionBaseData {
  gateway_account_id: string
  service_id: string
  amount: number
  state: StateData
  created_date: string
  gateway_transaction_id: string
  transaction_type: ResourceType
  transaction_id: string
  live: boolean
  settlement_summary: SettlementSummaryData

  // payments only
  credential_external_id?: string
  payment_provider?: string
  description?: string
  reference?: string
  language?: string
  return_url?: string
  card_details?: CardDetailsData
  delayed_capture?: boolean
  corporate_card_surcharge?: number
  email?: string
  wallet_type?: string
  moto?: boolean
  source?: string
  authorisation_mode?: string
  agreement_id?: string
  disputed?: boolean
  metadata?: Record<string, string>
  total_amount?: number
  refund_summary?: LedgerRefundSummaryData
  authorisation_summary?: AuthorisationSummaryData

  // refunds only
  refunded_by?: string
  refunded_by_user_email?: string

  // disputes only
  evidence_due_date?: string
  reason?: string

  // refunds and disputes
  parent_transaction_id?: string
  payment_details?: PaymentDetailsData

  // payments and disputes
  net_amount?: number
  fee?: number
}
