import {
  AuthorisationSummaryData,
  ChargeData,
  Link,
  RefundSummaryData,
  SettlementSummaryData,
} from '@models/charge/dto/Charge.dto'

class RefundSummary {
  readonly status: string
  readonly userExternalId: string | null
  readonly amountAvailable: number
  readonly amountSubmitted: number

  constructor(data: RefundSummaryData) {
    this.status = data.status
    this.userExternalId = data.user_external_id
    this.amountAvailable = data.amount_available
    this.amountSubmitted = data.amount_submitted
  }
}

class SettlementSummary {
  readonly captureSubmitTime: string | null
  readonly capturedDate: string | null

  constructor(data: SettlementSummaryData) {
    this.captureSubmitTime = data.capture_submit_time
    this.capturedDate = data.captured_date
  }
}

class AuthorisationSummary {
  readonly threeDSecure: {
    required: boolean
  }

  constructor(data: AuthorisationSummaryData) {
    this.threeDSecure = data.three_d_secure
  }
}

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
  readonly refundSummary?: RefundSummary // todo use common models, shared with tx
  readonly settlementSummary?: SettlementSummary // todo use common models, shared with tx
  readonly authorisationSummary?: AuthorisationSummary // todo use common models, shared with tx
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
