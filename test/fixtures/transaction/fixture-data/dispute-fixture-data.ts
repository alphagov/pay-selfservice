import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { SettlementSummaryFixture } from '@test/fixtures/transaction/settlement-summary.fixture'
import { ResourceType } from '@models/transaction/types/resource-type'
import { PaymentDetailsFixture } from '@test/fixtures/transaction/payment-details.fixture'
import { Reason } from '@models/transaction/types/reason'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { Status } from '@models/transaction/types/status'

const BASE_FIXTURE = new TransactionFixture()

// these should be representative of the actual data Ledger will return for each of these cases

const DISPUTE_NEEDS_RESPONSE_DATA: Partial<TransactionFixture> = {
  amount: 1000,
  createdDate: BASE_FIXTURE.createdDate.plus({ month: 4 }),
  state: new TransactionStateFixture({
    finished: false,
    status: Status.NEEDS_RESPONSE,
  }),
  gatewayTransactionId: 'dispute-gateway-transaction-id-123',
  settlementSummary: SettlementSummaryFixture.empty(),
  transactionType: ResourceType.DISPUTE,
  paymentDetails: new PaymentDetailsFixture({
    description: BASE_FIXTURE.description,
    reference: BASE_FIXTURE.reference,
    email: BASE_FIXTURE.email,
    cardDetails: BASE_FIXTURE.cardDetails,
    transactionType: ResourceType.PAYMENT,
  }),
  evidenceDueDate: BASE_FIXTURE.createdDate.plus({ month: 5 }),
  reason: Reason.FRAUDULENT,
  email: undefined,
}

const DISPUTE_UNDER_REVIEW_DATA: Partial<TransactionFixture> = {
  amount: 1000,
  createdDate: BASE_FIXTURE.createdDate.plus({ month: 4 }),
  state: new TransactionStateFixture({
    finished: false,
    status: Status.UNDER_REVIEW,
  }),
  gatewayTransactionId: 'dispute-gateway-transaction-id-123',
  settlementSummary: SettlementSummaryFixture.empty(),
  transactionType: ResourceType.DISPUTE,
  paymentDetails: new PaymentDetailsFixture({
    description: BASE_FIXTURE.description,
    reference: BASE_FIXTURE.reference,
    email: BASE_FIXTURE.email,
    cardDetails: BASE_FIXTURE.cardDetails,
    transactionType: ResourceType.PAYMENT,
  }),
  evidenceDueDate: BASE_FIXTURE.createdDate.plus({ month: 5 }),
  reason: Reason.FRAUDULENT,
  email: undefined,
}

const DISPUTE_WON_DATA: Partial<TransactionFixture> = {
  amount: 1000,
  createdDate: BASE_FIXTURE.createdDate.plus({ month: 4 }),
  state: new TransactionStateFixture({
    finished: true,
    status: Status.WON,
  }),
  gatewayTransactionId: 'dispute-gateway-transaction-id-123',
  settlementSummary: SettlementSummaryFixture.empty(),
  transactionType: ResourceType.DISPUTE,
  paymentDetails: new PaymentDetailsFixture({
    description: BASE_FIXTURE.description,
    reference: BASE_FIXTURE.reference,
    email: BASE_FIXTURE.email,
    cardDetails: BASE_FIXTURE.cardDetails,
    transactionType: ResourceType.PAYMENT,
  }),
  evidenceDueDate: BASE_FIXTURE.createdDate.plus({ month: 5 }),
  reason: Reason.FRAUDULENT,
  email: undefined,
}

const PSP_DISPUTE_FEE = 2000

const DISPUTE_LOST_DATA: Partial<TransactionFixture> = {
  amount: 1000,
  fee: PSP_DISPUTE_FEE,
  netAmount: -(BASE_FIXTURE.amount + PSP_DISPUTE_FEE),
  createdDate: BASE_FIXTURE.createdDate.plus({ month: 4 }),
  state: new TransactionStateFixture({
    finished: true,
    status: Status.LOST,
  }),
  gatewayTransactionId: 'dispute-gateway-transaction-id-123',
  settlementSummary: new SettlementSummaryFixture({
    settledDate: BASE_FIXTURE.createdDate.plus({ month: 6 }),
  }),
  transactionType: ResourceType.DISPUTE,
  paymentDetails: new PaymentDetailsFixture({
    description: BASE_FIXTURE.description,
    reference: BASE_FIXTURE.reference,
    email: BASE_FIXTURE.email,
    cardDetails: BASE_FIXTURE.cardDetails,
    transactionType: ResourceType.PAYMENT,
  }),
  evidenceDueDate: BASE_FIXTURE.createdDate.plus({ month: 5 }),
  reason: Reason.FRAUDULENT,
  email: undefined,
}

export { DISPUTE_NEEDS_RESPONSE_DATA, DISPUTE_UNDER_REVIEW_DATA, DISPUTE_WON_DATA, DISPUTE_LOST_DATA }
