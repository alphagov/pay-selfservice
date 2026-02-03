import { DateTime } from 'luxon'
import { ResourceType } from '@models/transaction/types/resource-type'
import { Reason } from '@models/transaction/types/reason'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { Transaction } from '@models/transaction/Transaction.class'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'

export class TransactionFixture {
  gatewayAccountId: string
  serviceExternalId: string
  credentialExternalId: string
  externalId: string
  gatewayTransactionId: string
  reference: string
  language: string
  returnUrl: string
  state: TransactionStateFixture
  amount: number // pence
  corporateCardSurcharge?: number // pence
  netAmount?: number // pence
  totalAmount?: number // pence
  fee?: number // pence
  createdDate: DateTime
  description: string
  paymentProvider: string
  email?: string
  walletType?: string
  disputed: boolean
  refundSummary: LedgerRefundSummaryFixture
  settlementSummary?: unknown
  authorisationSummary?: unknown
  cardDetails?: CardDetailsFixture
  transactionType: ResourceType
  reason?: Reason
  evidenceDueDate?: DateTime
  delayedCapture: boolean
  moto: boolean
  isLive: boolean
  source: string
  authorisationMode: string
  agreementId: string

  constructor(options?: Partial<TransactionFixture>) {
    this.gatewayAccountId = '100'
    this.serviceExternalId = 'service-external-id-123-abc'
    this.externalId = 'transaction-external-id-123-abc'
    this.gatewayTransactionId = 'gateway-transaction-id-123'
    this.credentialExternalId = 'credential-external-id-123-abc'
    this.language = 'en'
    this.returnUrl = 'https://payments.service.gov.uk'
    this.reference = 'transaction-reference'
    this.state = new TransactionStateFixture()
    this.amount = 1000
    this.createdDate = DateTime.fromISO('2025-07-22T03:14:15.926Z')
    this.description = 'a test transaction'
    this.paymentProvider = 'sandbox'
    this.disputed = false
    this.cardDetails = new CardDetailsFixture()
    this.transactionType = ResourceType.PAYMENT
    this.delayedCapture = false
    this.moto = false
    this.isLive = true
    this.source = 'API'
    this.authorisationMode = 'unknown'
    this.agreementId = 'none'
    this.refundSummary = new LedgerRefundSummaryFixture()
    if (options) {
      Object.assign(this, options)
    }
  }

  toTransaction() {
    return new Transaction({
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
      created_date: this.createdDate.toISODate()!,
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
      evidence_due_date: this.evidenceDueDate ? this.evidenceDueDate.toISODate()! : undefined,
      reason: this.reason,
      refund_summary: this.refundSummary?.toLedgerRefundSummaryData(),
    })
  }
}
