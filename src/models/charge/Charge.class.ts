import { ChargeData, Link } from '@models/charge/dto/Charge.dto'
import { AuthorisationSummary } from '@models/common/authorisation-summary/AuthorisationSummary.class'
import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { RefundSummary } from '@models/common/refund-summary/RefundSummary.class'

interface ChargeState {
  finished: boolean
  status: string
}

class Charge {
  readonly amount: number
  readonly state: ChargeState
  readonly description: string
  readonly reference: string
  readonly language: string
  readonly links: Link[]
  readonly chargeId: string
  readonly returnUrl: string
  readonly paymentProvider: string
  readonly createdDate: string
  readonly refundSummary?: RefundSummary
  readonly settlementSummary?: SettlementSummary
  readonly authorisationSummary?: AuthorisationSummary
  readonly delayedCapture: boolean
  readonly moto: boolean
  readonly authorisationMode: string
  /** @deprecated add the thing you need to the typedef */
  readonly rawResponse: ChargeData

  constructor(data: ChargeData) {
    this.amount = data.amount
    this.state = data.state
    this.description = data.description
    this.reference = data.reference
    this.language = data.language
    this.links = data.links
    this.chargeId = data.charge_id
    this.returnUrl = data.return_url
    this.paymentProvider = data.payment_provider
    this.createdDate = data.created_date
    this.refundSummary = data.refund_summary ? new RefundSummary(data.refund_summary) : undefined
    this.settlementSummary = data.settlement_summary ? new SettlementSummary(data.settlement_summary) : undefined
    this.authorisationSummary = data.authorisation_summary
      ? new AuthorisationSummary(data.authorisation_summary)
      : undefined
    this.delayedCapture = data.delayed_capture
    this.moto = data.moto
    this.authorisationMode = data.authorisation_mode
    this.rawResponse = data
  }
}

export = Charge
