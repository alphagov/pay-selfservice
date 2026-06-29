import { DateTime } from 'luxon'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionEvents,
  getTransactionForGatewayAccount,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { RefundSummaryStatus } from '@models/common/refund-summary/RefundSummaryStatus'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { GatewayAccountType } from '@models/gateway-account/gateway-account-type'
import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'

const TRANSACTION_CREATED_TIMESTAMP = DateTime.fromISO('2025-07-22T03:14:15.926+01:00')
const TRANSACTION = new TransactionFixture({ createdDate: TRANSACTION_CREATED_TIMESTAMP })

const TRANSACTION_EVENTS = [
  new TransactionEventFixture({
    amount: 1250,
    state: {
      finished: false,
      status: 'CREATED',
    },
    resourceType: 'PAYMENT',
    eventType: 'PAYMENT_CREATED',
    timestamp: TRANSACTION_CREATED_TIMESTAMP,
  }),
]

const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gatewayAccountId
const SERVICE_EXTERNAL_ID = TRANSACTION.serviceExternalId
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTION_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION.externalId}`

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({
    userExternalId: USER_EXTERNAL_ID,
    email: USER_EMAIL,
    serviceExternalId: SERVICE_EXTERNAL_ID,
    gatewayAccountId: GATEWAY_ACCOUNT_ID,
    serviceName: SERVICE_NAME,
    role: ROLES['view-and-refund'],
  }),
  gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, GatewayAccountType.TEST, {
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  }),
]

describe('Transaction details page', () => {
  describe('for refunded payments', () => {
    describe('for a partial refund', () => {
      it('should display the partial refund amount', () => {
        const amount = 1000
        const refundAmount = 500

        const refundSummary = new LedgerRefundSummaryFixture({
          amountRefunded: refundAmount,
          status: RefundSummaryStatus.AVAILABLE,
          userExternalId: USER_EXTERNAL_ID,
          amountAvailable: amount - refundAmount,
          amountSubmitted: refundAmount,
        })
        const transactionWithRefund = new TransactionFixture({ amount, refundSummary })

        cy.setEncryptedCookies(USER_EXTERNAL_ID)
        cy.task('setupStubs', [
          ...userAndGatewayAccountStubs,
          getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, transactionWithRefund.externalId).success(
            transactionWithRefund
          ),
          getTransactionEvents(GATEWAY_ACCOUNT_ID, transactionWithRefund.externalId).success(TRANSACTION_EVENTS),
        ])

        cy.visit(TRANSACTION_URL)

        cy.get('.govuk-summary-list__row')
          .eq(6)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Refunded amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '-£5.00')
          })
      })
    })

    describe('for a full refund', () => {
      it('should display the full refund amount', () => {
        const amount = 1000
        const refundAmount = 1000

        const refundSummary = new LedgerRefundSummaryFixture({
          amountRefunded: refundAmount,
          status: RefundSummaryStatus.AVAILABLE,
          userExternalId: USER_EXTERNAL_ID,
          amountAvailable: amount - refundAmount,
          amountSubmitted: refundAmount,
        })
        const transactionWithRefund = new TransactionFixture({ amount, refundSummary })

        cy.setEncryptedCookies(USER_EXTERNAL_ID)
        cy.task('setupStubs', [
          ...userAndGatewayAccountStubs,
          getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, transactionWithRefund.externalId).success(
            transactionWithRefund
          ),
          getTransactionEvents(GATEWAY_ACCOUNT_ID, transactionWithRefund.externalId).success(TRANSACTION_EVENTS),
        ])

        cy.visit(TRANSACTION_URL)

        cy.get('.govuk-summary-list__row')
          .eq(6)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Refunded amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '-£10.00')
          })
      })
    })
  })

  describe('for a payment eligible for a refund', () => {
    it('should display the refund button and be able to navigate to refund page', () => {
      cy.setEncryptedCookies(USER_EXTERNAL_ID)
      cy.task('setupStubs', [
        ...userAndGatewayAccountStubs,
        getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
        getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
      ])
      cy.visit(TRANSACTION_URL)
      cy.contains('a.govuk-button', 'Refund payment').should('be.visible').click()

      const refundUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/${TRANSACTION.externalId}/refund`

      cy.url().should('include', refundUrl)
    })
  })

  describe('for a payment not eligible for a refund', () => {
    it('should not display refund button', () => {
      const refundUnavailableState = new LedgerRefundSummaryFixture({ status: RefundSummaryStatus.UNAVAILABLE })
      const transactionWithRefundUnavailable = new TransactionFixture({ refundSummary: refundUnavailableState })

      cy.setEncryptedCookies(USER_EXTERNAL_ID)
      cy.task('setupStubs', [
        ...userAndGatewayAccountStubs,
        getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(
          transactionWithRefundUnavailable
        ),
        getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
      ])
      cy.visit(TRANSACTION_URL)
      cy.contains('a.govuk-button', 'Refund payment').should('not.exist')
    })
  })
})
