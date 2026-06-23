import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { DateTime } from 'luxon'
import { ResourceType } from '@models/transaction/types/resource-type'
import { SettlementSummaryFixture } from '@test/fixtures/transaction/settlement-summary.fixture'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { AuthorisationSummaryFixture } from '@test/fixtures/transaction/authorisation-summary.fixture'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'
import { Reason } from '@models/transaction/types/reason'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'
import { Transaction } from '@models/transaction/Transaction.model'
import { TransactionData } from '@models/transaction/dto/Transaction.dto'

export class TransactionBaseFixture {
  gatewayAccountId: string
  serviceExternalId: string
  externalId: string
  gatewayTransactionId: string
  state: TransactionStateFixture
  amount: number // pence
  createdDate: DateTime
  transactionType: ResourceType
  isLive: boolean
  settlementSummary: SettlementSummaryFixture

  credentialExternalId?: string
  reference?: string
  language?: string
  returnUrl?: string
  corporateCardSurcharge?: number // pence
  netAmount?: number // pence
  totalAmount?: number // pence
  fee?: number // pence
  description?: string
  paymentProvider?: string
  email?: string
  walletType?: string
  disputed?: boolean
  refundSummary?: LedgerRefundSummaryFixture
  authorisationSummary?: AuthorisationSummaryFixture
  cardDetails?: CardDetailsFixture
  reason?: Reason
  evidenceDueDate?: DateTime
  delayedCapture?: boolean
  moto?: boolean
  source?: string
  authorisationMode?: string
  agreementId?: string
  paymentDetails?: PaymentDetailsFixture
  parentTransactionExternalId?: string
  metadata?: Record<string, string>
  refundedBy?: string
  refundedByUserEmail?: string

  constructor(...options: Partial<TransactionBaseFixture>[]) {
    this.gatewayAccountId = '100'
    this.serviceExternalId = 'service-external-id-123-abc'
    this.externalId = 'transaction-external-id-123-abc'
    this.gatewayTransactionId = 'gateway-transaction-id-123'
    this.state = new TransactionStateFixture()
    this.amount = 1000
    this.createdDate = DateTime.fromISO('2025-07-22T03:14:15.926+01:00', { zone: 'Europe/London' })
    this.email = 'test2@example.org'
    this.transactionType = ResourceType.PAYMENT
    this.isLive = true
    this.settlementSummary = SettlementSummaryFixture.empty()

    options.forEach((optionObject) => {
      Object.assign(this, optionObject)
    })
  }

  toTransactionData(): TransactionData {
    return {
      gateway_account_id: this.gatewayAccountId,
      service_id: this.serviceExternalId,
      credential_external_id: this.credentialExternalId,
      amount: this.amount,
      net_amount: this.netAmount,
      total_amount: this.totalAmount,
      corporate_card_surcharge: this.corporateCardSurcharge,
      fee: this.fee,
      state: this.state.toStateData(),
      description: this.description,
      reference: this.reference,
      language: this.language,
      return_url: this.returnUrl,
      email: this.email,
      payment_provider: this.paymentProvider,
      created_date: this.createdDate.toISO()!,
      card_details: this.cardDetails?.toCardDetailsData(),
      delayed_capture: this.delayedCapture,
      gateway_transaction_id: this.gatewayTransactionId,
      transaction_type: this.transactionType,
      wallet_type: this.walletType,
      moto: this.moto,
      live: this.isLive,
      source: this.source,
      authorisation_mode: this.authorisationMode,
      agreement_id: this.agreementId,
      disputed: this.disputed,
      transaction_id: this.externalId,
      evidence_due_date: this.evidenceDueDate?.toISO() ?? undefined,
      reason: this.reason,
      refund_summary: this.refundSummary?.toLedgerRefundSummaryData(),
      authorisation_summary: this.authorisationSummary?.toAuthorisationSummaryData(),
      payment_details: this.paymentDetails?.toPaymentDetailsData(),
      parent_transaction_id: this.parentTransactionExternalId,
      metadata: this.metadata,
      settlement_summary: this.settlementSummary?.toSettlementSummaryData() ?? {},
      refunded_by: this.refundedBy,
      refunded_by_user_email: this.refundedByUserEmail,
    } as TransactionData
  }

  toTransaction() {
    return Transaction.fromLedgerResponse(this.toTransactionData())
  }
}
