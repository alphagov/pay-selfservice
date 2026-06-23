import { TransactionBaseFixture } from '@test/fixtures/transaction/transaction-base.fixture'
import { DisputeData } from '@models/transaction/dto/Dispute.dto'
import { Dispute } from '@models/transaction/Dispute.class'
import { DateTime } from 'luxon'
import { Reason } from '@models/transaction/types/reason'
import { ResourceType } from '@models/transaction/types/resource-type'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { Status } from '@models/transaction/types/status'
import { SettlementSummaryFixture } from '@test/fixtures/transaction/settlement-summary.fixture'

const PSP_DISPUTE_FEE = 2000

export class DisputeFixture extends TransactionBaseFixture {
  readonly transactionType: typeof ResourceType.DISPUTE

  readonly paymentDetails: PaymentDetailsFixture
  readonly parentTransactionExternalId: string
  readonly evidenceDueDate: DateTime
  readonly reason: Reason

  declare readonly fee?: number
  declare readonly netAmount?: number

  constructor(...options: Partial<DisputeFixture>[]) {
    super(...options)

    this.externalId = 'dispute-external-id-123-abc'
    this.paymentDetails = new PaymentDetailsFixture()
    this.parentTransactionExternalId = 'transaction-external-id-123-abc'
    this.evidenceDueDate = DateTime.fromISO('2025-12-22T17:14:15.926Z', { zone: 'Europe/London' })
    this.reason = Reason.FRAUDULENT

    this.transactionType = ResourceType.DISPUTE
  }

  static NeedsResponse(...options: Partial<DisputeFixture>[]) {
    return new DisputeFixture(
      {
        amount: 1000,
        createdDate: DateTime.fromISO('2025-11-22T17:14:15.926Z', { zone: 'Europe/London' }),
        state: new TransactionStateFixture({
          finished: false,
          status: Status.NEEDS_RESPONSE,
        }),
        gatewayTransactionId: 'dispute-gateway-transaction-id-123',
        reason: Reason.FRAUDULENT,
      },
      ...options
    )
  }

  static UnderReview(...options: Partial<DisputeFixture>[]) {
    return new DisputeFixture(
      {
        amount: 1000,
        createdDate: DateTime.fromISO('2025-11-22T17:14:15.926Z', { zone: 'Europe/London' }),
        state: new TransactionStateFixture({
          finished: false,
          status: Status.UNDER_REVIEW,
        }),
        gatewayTransactionId: 'dispute-gateway-transaction-id-123',
        reason: Reason.FRAUDULENT,
      },
      ...options
    )
  }

  static Won(...options: Partial<DisputeFixture>[]) {
    return new DisputeFixture(
      {
        amount: 1000,
        createdDate: DateTime.fromISO('2025-11-22T17:14:15.926Z', { zone: 'Europe/London' }),
        state: new TransactionStateFixture({
          finished: true,
          status: Status.WON,
        }),
        gatewayTransactionId: 'dispute-gateway-transaction-id-123',
        reason: Reason.FRAUDULENT,
      },
      ...options
    )
  }

  static Lost(...options: Partial<DisputeFixture>[]) {
    return new DisputeFixture(
      {
        amount: 1000,
        fee: PSP_DISPUTE_FEE,
        netAmount: -(1000 + PSP_DISPUTE_FEE),
        createdDate: DateTime.fromISO('2025-11-22T17:14:15.926Z', { zone: 'Europe/London' }),
        state: new TransactionStateFixture({
          finished: true,
          status: Status.LOST,
        }),
        settlementSummary: new SettlementSummaryFixture({
          settledDate: DateTime.fromISO('2026-01-22T17:14:15.926Z', { zone: 'Europe/London' }),
        }),
        gatewayTransactionId: 'dispute-gateway-transaction-id-123',
        reason: Reason.FRAUDULENT,
      },
      ...options
    )
  }

  toDisputeData(): DisputeData {
    return this.toTransactionData() as DisputeData
  }

  toDispute(): Dispute {
    return new Dispute(this.toDisputeData())
  }

  // define properties not present on Disputes
  declare reference: undefined
  declare corporateCardSurcharge: undefined
  declare totalAmount: undefined
  declare description: undefined
  declare paymentProvider: undefined
  declare email: undefined
  declare walletType: undefined
  declare disputed: undefined
  declare refundSummary: undefined
  declare authorisationSummary: undefined
  declare cardDetails: undefined
  declare metadata: undefined
  declare refundedBy: undefined
  declare refundedByUserEmail: undefined
}
