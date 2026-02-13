import { TransactionData } from '@models/transaction/dto/Transaction.dto'
import { DateTime } from 'luxon'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { AuthorisationSummary } from '@models/common/authorisation-summary/AuthorisationSummary.class'
import { LedgerRefundSummary } from '@models/common/refund-summary/LedgerRefundSummary.class'
import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { CardDetails } from '@models/common/card-details/CardDetails.class'
import { ResourceType } from './types/resource-type'
import { DisputeStatusFriendlyNames, PaymentStatusFriendlyNames, RefundStatusFriendlyNames } from './types/status'
import { State } from './State.class'
import { parseReason, Reason } from './types/reason'
import { RefundSummaryStatus } from '@models/common/refund-summary/RefundSummaryStatus'
import { TransactionLinksGenerator } from '@models/transaction/TransactionLinksGenerator.class'
import { TransactionDisplayValues } from '@models/transaction/TransactionDisplayValues.class'
import { PaymentDetails } from '@models/transaction/PaymentDetails.class'

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
  readonly paymentDetails?: PaymentDetails

  readonly _locals: {
    links: TransactionLinksGenerator
    formatted: TransactionDisplayValues
  }

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
    this.paymentDetails = data.payment_details && new PaymentDetails(data.payment_details)

    this._locals = {
      links: new TransactionLinksGenerator(this.externalId),
      formatted: new TransactionDisplayValues(this),
    }
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

  isDispute(): boolean {
    return this.transactionType === ResourceType.DISPUTE
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
    return (this.corporateCardSurcharge) ?? false
  }
}

export { Transaction }
