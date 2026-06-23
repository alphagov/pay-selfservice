import { TransactionData } from '@models/transaction/dto/Transaction.dto'
import { DateTime } from 'luxon'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { AuthorisationSummary } from '@models/common/authorisation-summary/AuthorisationSummary.class'
import { LedgerRefundSummary } from '@models/common/refund-summary/LedgerRefundSummary.class'
import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { CardDetails } from '@models/common/card-details/CardDetails.class'
import { ResourceType } from './types/resource-type'
import {
  DisputeStatusFriendlyNames,
  PaymentStatusFriendlyNames,
  RefundStatusFriendlyNames,
  Status,
} from './types/status'
import { State } from './State.class'
import { Reason } from './types/reason'
import { RefundSummaryStatus } from '@models/common/refund-summary/RefundSummaryStatus'
import { TransactionLinksGenerator } from '@models/transaction/TransactionLinksGenerator.class'
import { TransactionDisplayValues } from '@models/transaction/TransactionDisplayValues.class'
import { PaymentDetails } from '@models/transaction/PaymentDetails.class'
import { TransactionBaseData } from '@models/transaction/dto/TransactionBase.dto'

// describes all possible properties on a Transaction
// some properties are common to all Transaction types
// some are only set on certain Transaction types
export class TransactionBase {
  // INFO: this is not a complete class yet, see TransactionData interface
  // common to all transactions
  readonly gatewayAccountId: string
  readonly serviceExternalId: string
  readonly externalId: string
  readonly gatewayTransactionId: string
  readonly state: State
  readonly amount: number // pence
  readonly createdDate: DateTime
  readonly transactionType: ResourceType
  readonly isLive: boolean
  readonly settlementSummary: SettlementSummary

  // only on some transactions
  reference?: string
  corporateCardSurcharge?: number // pence
  netAmount?: number // pence
  totalAmount?: number // pence
  fee?: number // pence
  description?: string
  paymentProvider?: string
  email?: string
  walletType?: string
  disputed?: boolean
  refundSummary?: LedgerRefundSummary
  authorisationSummary?: AuthorisationSummary
  cardDetails?: CardDetails
  reason?: Reason
  evidenceDueDate?: DateTime
  paymentDetails?: PaymentDetails
  parentTransactionExternalId?: string
  metadata?: Record<string, string>
  refundedBy?: string
  refundedByUserEmail?: string

  data: TransactionBaseData

  _locals: {
    links: TransactionLinksGenerator
    formatted: TransactionDisplayValues
  }

  constructor(data: TransactionBaseData) {
    this.gatewayAccountId = data.gateway_account_id
    this.serviceExternalId = data.service_id
    this.externalId = data.transaction_id
    this.gatewayTransactionId = data.gateway_transaction_id
    this.state = new State(data.state)
    this.amount = data.amount
    this.createdDate = DateTime.fromISO(data.created_date, { zone: 'Europe/London' })
    this.transactionType = data.transaction_type
    this.settlementSummary = new SettlementSummary(data.settlement_summary)
    // this.reason = data.reason ? parseReason(data.reason) : undefined
    // this.evidenceDueDate = data.evidence_due_date
    //   ? DateTime.fromISO(data.evidence_due_date, { zone: 'Europe/London' })
    //   : undefined
    this.data = data
    // this.paymentDetails = data.payment_details && new PaymentDetails(data.payment_details)
    // this.parentTransactionExternalId = data.parent_transaction_id
    this.isLive = data.live

    this._locals = {
      links: new TransactionLinksGenerator(this.getRootTransactionId()),
      formatted: new TransactionDisplayValues(this),
    }
  }

  refundableAmountRemainingInPounds(): string {
    return penceToPoundsWithCurrency(this.getRefundableAmountRemaining())
  }

  getRefundableAmountRemaining() {
    return this.refundSummary ? this.refundSummary.amountAvailable : this.amount
  }

  getRootTransactionId(): string {
    return this.parentTransactionExternalId ?? this.externalId
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

  isDispute(): boolean {
    return this.transactionType === ResourceType.DISPUTE
  }

  isDisputePending(): boolean {
    return (
      this.isDispute() && (this.state.status === Status.NEEDS_RESPONSE || this.state.status === Status.UNDER_REVIEW)
    )
  }

  isDisputeLost(): boolean {
    return this.isDispute() && this.state.status === Status.LOST
  }

  hasRefund(): boolean {
    return (this.refundSummary && this.refundSummary.amountRefunded > 0) ?? false
  }

  isPartiallyRefunded(): boolean {
    return (this.refundSummary && this.refundSummary.amountAvailable !== this.amount) ?? false
  }

  isFullyRefunded() {
    return (this.refundSummary && this.refundSummary.amountAvailable === 0) ?? false
  }

  isRefundable() {
    return (
      this.refundSummary?.status === RefundSummaryStatus.AVAILABLE ||
      this.refundSummary?.status === RefundSummaryStatus.ERROR
    )
  }

  hasCorporateCardSurcharge() {
    return this.corporateCardSurcharge ?? false
  }
}
