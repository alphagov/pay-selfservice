import { TransactionData } from '@models/ledger/dto/Transaction.dto'
import { DateTime } from 'luxon'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { AuthorisationSummary } from '@models/common/authorisation-summary/AuthorisationSummary.class'
import { LedgerRefundSummary } from '@models/common/refund-summary/LedgerRefundSummary.class'
import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { CardDetails } from '@models/common/card-details/CardDetails.class'
import { ResourceType } from './types/resource-type'
import { DisputeStatusFriendlyNames, PaymentStatusFriendlyNames, RefundStatusFriendlyNames } from './types/status'
import { State } from './State.class'
import { parseReason, Reason, ReasonFriendlyNames } from './types/reason'

const TITLE_FRIENDLY_DATESTAMP_FORMAT = 'dd LLLL yyyy HH:mm:ss'

class Transaction {
  // INFO: this is not a complete class yet, see TransactionData interface
  readonly gatewayAccountId: string
  readonly serviceExternalId: string
  readonly externalId: string
  readonly gatewayTransactionId: string
  readonly reference: string
  readonly state: State
  readonly amount: number // pence
  readonly corporateCardSurcharge?: number // pence
  readonly netAmount?: number // pence
  readonly totalAmount?: number // pence
  readonly fee?: number // pence
  readonly createdDate: DateTime
  readonly description: string
  readonly paymentProvider: string
  readonly email?: string
  readonly walletType?: string
  readonly disputed: boolean
  readonly refundSummary?: LedgerRefundSummary
  readonly settlementSummary?: SettlementSummary
  readonly authorisationSummary?: AuthorisationSummary
  readonly cardDetails?: CardDetails
  readonly transactionType: ResourceType
  readonly reason?: Reason
  readonly evidenceDueDate?: DateTime
  readonly data: TransactionData

  constructor(data: TransactionData) {
    this.gatewayAccountId = data.gateway_account_id
    this.serviceExternalId = data.service_id
    this.externalId = data.transaction_id
    this.gatewayTransactionId = data.gateway_transaction_id
    this.reference = data.reference
    this.state = new State(data.state)
    this.amount = data.amount
    this.corporateCardSurcharge = data.corporate_card_surcharge
    this.netAmount = data.net_amount
    this.totalAmount = data.total_amount
    this.fee = data.fee
    this.createdDate = DateTime.fromISO(data.created_date)
    this.description = data.description
    this.paymentProvider = data.payment_provider
    this.walletType = data.wallet_type
    this.email = data.email
    this.disputed = data.disputed
    this.refundSummary = data.refund_summary && new LedgerRefundSummary(data.refund_summary)
    this.settlementSummary = data.settlement_summary && new SettlementSummary(data.settlement_summary)
    this.authorisationSummary = data.authorisation_summary && new AuthorisationSummary(data.authorisation_summary)
    this.cardDetails = data.card_details && new CardDetails(data.card_details)
    this.transactionType = data.transaction_type
    this.reason = data.reason ? parseReason(data.reason) : undefined
    this.evidenceDueDate = data.evidence_due_date ? DateTime.fromISO(data.evidence_due_date) : undefined
    this.data = data
  }

  amountInPounds(): string {
    return penceToPoundsWithCurrency(this.amount)
  }

  refundableAmountRemainingInPounds(): string {
    return penceToPoundsWithCurrency(this.getRefundableAmountRemaining())
  }

  getRefundableAmountRemaining() {
    return this.refundSummary ? this.refundSummary.amountAvailable : this.amount
  }

  get friendlyTransactionStatus(): string {
    switch (this.transactionType) {
      case ResourceType.PAYMENT:
        return PaymentStatusFriendlyNames[this.state.status] ?? this.state.status
      case ResourceType.REFUND:
        return RefundStatusFriendlyNames[this.state.status] ?? this.state.status
      case ResourceType.DISPUTE:
        return DisputeStatusFriendlyNames[this.state.status] ?? this.state.status
      default:
        return this.state.status
    }
  }

  get titleFriendlyCreatedDate(): string {
    return this.createdDate.toFormat(TITLE_FRIENDLY_DATESTAMP_FORMAT)
  }

  get friendlyReason() {
    if (this.reason !== undefined) {
      return ReasonFriendlyNames[this.reason] ?? ReasonFriendlyNames.OTHER
    }
  }

  isPartiallyRefunded(): boolean {
    return (this.refundSummary && this.refundSummary.amountAvailable !== this.amount) ?? false
  }

  isFullyRefunded() {
    return (this.refundSummary && this.refundSummary.amountAvailable === 0) ?? false
  }
}

export { Transaction }
