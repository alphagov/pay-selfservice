import { CardDetailsData } from '@models/common/card-details/dto/CardDetails.dto'

export interface TransactionData {
  gateway_account_id: string
  service_id: string
  credential_external_id: string
  amount: number
  state: {
    finished: boolean,
    status: string
  },
  description: string
  reference: string
  language: string
  return_url: string
  email: string
  payment_provider: string
  created_date: string
  card_details?: CardDetailsData
  delayed_capture: boolean
  gateway_transaction_id: string
  refund_summary: {
    status: string
    user_external_id?: string
    amount_available: number
    amount_submitted: number
    amount_refunded: number
  }
  settlement_summary: { // optional?
    capture_submit_time: string
    captured_date: string
  }
  authorisation_summary: {
    three_d_secure: {
      required: boolean
    }
  }
  transaction_type: string
  moto: boolean
  live: boolean
  source: string
  authorisation_mode: string
  agreement_id: string
  disputed: boolean
  transaction_id: string
}
