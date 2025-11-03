import { RefundSummaryData } from '@models/common/refund-summary/dto/RefundSummary.dto'
import { SettlementSummaryData } from '@models/common/settlement-summary/dto/SettlementSummary.dto'
import { AuthorisationSummaryData } from '@models/common/authorisation-summary/dto/AuthorisationSummary.dto'

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
