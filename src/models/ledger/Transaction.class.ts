import { TransactionData } from '@models/ledger/dto/Transaction.dto'
import { DateTime } from 'luxon'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { AuthorisationSummary } from '@models/common/authorisation-summary/AuthorisationSummary.class'
import { RefundSummary } from '@models/common/refund-summary/RefundSummary.class'
import { SettlementSummary } from '@models/common/settlement-summary/SettlementSummary.class'
import { CardDetails } from '@models/common/card-details/CardDetails.class'

class Transaction {
  // INFO: this is not a complete class yet, see TransactionData interface
  readonly gatewayAccountId: string
  readonly serviceExternalId: string
  readonly externalId: string
  readonly gatewayTransactionId: string
  readonly reference: string
  readonly state: {
    finished: boolean
    status: string
  }
  readonly amount: number // pence
  readonly createdDate: DateTime
  readonly description: string
  readonly paymentProvider: string
  readonly email?: string
  readonly walletType?: string
  readonly disputed: boolean
  readonly refundSummary: RefundSummary
  readonly settlementSummary: SettlementSummary
  readonly authorisationSummary?: AuthorisationSummary
  readonly cardDetails?: CardDetails
  readonly data: TransactionData

  constructor(data: TransactionData) {
    this.gatewayAccountId = data.gateway_account_id
    this.serviceExternalId = data.service_id
    this.externalId = data.transaction_id
    this.gatewayTransactionId = data.gateway_transaction_id
    this.reference = data.reference
    this.state = data.state
    this.amount = data.amount
    this.createdDate = DateTime.fromISO(data.created_date)
    this.description = data.description
    this.paymentProvider = data.payment_provider
    this.walletType = data.wallet_type
    this.email = data.email
    this.disputed = data.disputed
    this.refundSummary = new RefundSummary(data.refund_summary)
    this.settlementSummary = new SettlementSummary(data.settlement_summary)
    this.authorisationSummary = data.authorisation_summary
      ? new AuthorisationSummary(data.authorisation_summary)
      : undefined
    this.cardDetails = data.card_details ? new CardDetails(data.card_details) : undefined
    this.data = data
  }

  amountInPounds(): string {
    return penceToPoundsWithCurrency(this.amount)
  }
}

export { Transaction }
