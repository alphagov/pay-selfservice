export interface Link {
  rel: string
  method: string
  href: string
  type: string
  params: {
    chargeTokenId: string
    [key: string]: string
  }
}

export interface RefundSummaryData {
  status: string
  user_external_id: string | null
  amount_available: number
  amount_submitted: number
}

export interface SettlementSummaryData {
  capture_submit_time: string | null
  captured_date: string | null
}

export interface AuthorisationSummaryData {
  three_d_secure: {
    required: false
  }
}

export interface ChargeData {
  amount: number
  state: {
    finished: boolean
    status: string
  }
  description: string
  reference: string
  language: string
  links: Link[]
  charge_id: string
  return_url: string
  payment_provider: string
  created_date: string
  refund_summary: RefundSummaryData
  settlement_summary: SettlementSummaryData
  authorisation_summary: AuthorisationSummaryData
  delayed_capture: boolean
  moto: boolean
  authorisation_mode: string
}
