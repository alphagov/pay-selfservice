import { PaymentFixture } from '@test/fixtures/transaction/payment.fixture'
import { RefundFixture } from '@test/fixtures/transaction/refund.fixture'
import { DisputeFixture } from '@test/fixtures/transaction/dispute.fixture'

export type TransactionFixture = PaymentFixture | RefundFixture | DisputeFixture

export const TransactionFixture = {
  Payment: PaymentFixture,
  Refund: RefundFixture,
  Dispute: DisputeFixture,
}
