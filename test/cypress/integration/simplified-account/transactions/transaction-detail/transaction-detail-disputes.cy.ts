import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionDisputes,
  getTransactionForGatewayAccount,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { DateTime } from 'luxon'
import {
  DISPUTE_LOST_DATA,
  DISPUTE_NEEDS_RESPONSE_DATA,
  DISPUTE_UNDER_REVIEW_DATA,
  DISPUTE_WON_DATA,
} from '@test/fixtures/transaction/fixture-data/dispute-fixture-data'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { beforeEach } from 'mocha'

const TRANSACTION_CREATED_TIMESTAMP = DateTime.fromISO('2025-07-22T03:14:15.926+01:00')
const TRANSACTION = new TransactionFixture({ createdDate: TRANSACTION_CREATED_TIMESTAMP })

const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gatewayAccountId
const SERVICE_EXTERNAL_ID = TRANSACTION.serviceExternalId
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTION_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${TRANSACTION.externalId}`

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
  describe('for disputed payments', () => {
    const baseParent = new TransactionFixture(TRANSACTION, { disputed: true })

    describe('for a dispute awaiting evidence', () => {
      beforeEach(() => {
        const parentTransaction = new TransactionFixture(baseParent, {
          refundSummary: new LedgerRefundSummaryFixture({
            status: 'unavailable',
            amountAvailable: 0,
          }),
        })
        const disputeTransaction = new TransactionFixture(DISPUTE_NEEDS_RESPONSE_DATA)

        cy.setEncryptedCookies(USER_EXTERNAL_ID)
        cy.task('setupStubs', [
          ...userAndGatewayAccountStubs,
          getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success(parentTransaction),
          transactionStubs.getLedgerEventsSuccess({
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactionId: parentTransaction.externalId,
            events: [],
          }),
          getTransactionDisputes(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success([disputeTransaction]),
        ])
      })

      it('should not show the refund button and have the correct content', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('.govuk-button').contains('Refund payment').should('not.exist')

        cy.get('h1')
          .contains('Transaction details')
          .next()
          .should('have.class', 'govuk-body')
          .should('contain.text', 'You cannot refund this payment because it is being disputed.')
      })

      it('should display the correct dispute information', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('h2').should('contain.text', 'Dispute details')

        cy.get('.govuk-summary-list__row')
          .eq(15)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Status')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Dispute awaiting evidence')
          })

        cy.get('.govuk-summary-list__row')
          .eq(16)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Date disputed')
            cy.get('.govuk-summary-list__value').should('contain.text', `22 Nov 25 - 03:14:15 (GMT)`)
          })

        cy.get('.govuk-summary-list__row')
          .eq(17)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Disputed amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '£10.00')
          })

        cy.get('.govuk-summary-list__row')
          .eq(18)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Reason')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Fraudulent')
          })

        cy.get('.govuk-summary-list__row')
          .eq(19)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Evidence due by')
            cy.get('.govuk-summary-list__value').should('contain.text', '22 Dec 25 - 03:14:15 (GMT)')
          })
      })
    })

    describe('for a dispute under review', () => {
      beforeEach(() => {
        const parentTransaction = new TransactionFixture(baseParent, {
          refundSummary: new LedgerRefundSummaryFixture({
            status: 'unavailable',
            amountAvailable: 0,
          }),
        })
        const disputeTransaction = new TransactionFixture(DISPUTE_UNDER_REVIEW_DATA)

        cy.setEncryptedCookies(USER_EXTERNAL_ID)
        cy.task('setupStubs', [
          ...userAndGatewayAccountStubs,
          getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success(parentTransaction),
          transactionStubs.getLedgerEventsSuccess({
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactionId: parentTransaction.externalId,
            events: [],
          }),
          getTransactionDisputes(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success([disputeTransaction]),
        ])
      })

      it('should not show the refund button and have the correct content', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('.govuk-button').contains('Refund payment').should('not.exist')

        cy.get('h1')
          .contains('Transaction details')
          .next()
          .should('have.class', 'govuk-body')
          .should('contain.text', 'You cannot refund this payment because it is being disputed.')
      })

      it('should display the correct dispute information', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('h2').should('contain.text', 'Dispute details')

        cy.get('.govuk-summary-list__row')
          .eq(15)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Status')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Dispute under review')
          })

        cy.get('.govuk-summary-list__row')
          .eq(16)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Date disputed')
            cy.get('.govuk-summary-list__value').should('contain.text', `22 Nov 25 - 03:14:15 (GMT)`)
          })

        cy.get('.govuk-summary-list__row')
          .eq(17)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Disputed amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '£10.00')
          })

        cy.get('.govuk-summary-list__row')
          .eq(18)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Reason')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Fraudulent')
          })

        cy.get('.govuk-summary-list__row')
          .eq(19)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Evidence due by')
            cy.get('.govuk-summary-list__value').should('contain.text', '22 Dec 25 - 03:14:15 (GMT)')
          })
      })
    })

    describe('for a dispute won in the services favour', () => {
      beforeEach(() => {
        const parentTransaction = new TransactionFixture(baseParent, {
          refundSummary: new LedgerRefundSummaryFixture({
            status: 'available',
            amountAvailable: baseParent.amount,
          }),
        })
        const disputeTransaction = new TransactionFixture(DISPUTE_WON_DATA)

        cy.setEncryptedCookies(USER_EXTERNAL_ID)
        cy.task('setupStubs', [
          ...userAndGatewayAccountStubs,
          getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success(parentTransaction),
          transactionStubs.getLedgerEventsSuccess({
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactionId: parentTransaction.externalId,
            events: [],
          }),
          getTransactionDisputes(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success([disputeTransaction]),
        ])
      })

      it('should show the refund button', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('h1')
          .contains('Transaction details')
          .next()
          .should('have.class', 'govuk-button')
          .should('contain.text', 'Refund payment')
      })

      it('should display the correct dispute information', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('h2').should('contain.text', 'Dispute details')

        cy.get('.govuk-summary-list__row')
          .eq(15)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Status')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Dispute won in your favour')
          })

        cy.get('.govuk-summary-list__row')
          .eq(16)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Date disputed')
            cy.get('.govuk-summary-list__value').should('contain.text', `22 Nov 25 - 03:14:15 (GMT)`)
          })

        cy.get('.govuk-summary-list__row')
          .eq(17)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Disputed amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '£10.00')
          })

        cy.get('.govuk-summary-list__row')
          .eq(18)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Reason')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Fraudulent')
          })

        cy.get('.govuk-summary-list__row')
          .eq(19)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Evidence due by')
            cy.get('.govuk-summary-list__value').should('contain.text', '22 Dec 25 - 03:14:15 (GMT)')
          })
      })
    })

    describe('for a dispute lost to the user', () => {
      beforeEach(() => {
        const parentTransaction = new TransactionFixture(baseParent, {
          refundSummary: new LedgerRefundSummaryFixture({
            status: 'unavailable',
            amountAvailable: 0,
          }),
        })
        const disputeTransaction = new TransactionFixture(DISPUTE_LOST_DATA)

        cy.setEncryptedCookies(USER_EXTERNAL_ID)
        cy.task('setupStubs', [
          ...userAndGatewayAccountStubs,
          getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success(parentTransaction),
          transactionStubs.getLedgerEventsSuccess({
            gatewayAccountId: GATEWAY_ACCOUNT_ID,
            transactionId: parentTransaction.externalId,
            events: [],
          }),
          getTransactionDisputes(GATEWAY_ACCOUNT_ID, parentTransaction.externalId).success([disputeTransaction]),
        ])
      })

      it('should not show the refund button and have the correct content', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('.govuk-button').contains('Refund payment').should('not.exist')

        cy.get('h1')
          .contains('Transaction details')
          .next()
          .should('have.class', 'govuk-body')
          .should(
            'contain.text',
            'You cannot refund this payment because it was disputed and the paying user won the dispute.'
          )
      })

      it('should display the correct dispute information', () => {
        cy.visit(TRANSACTION_URL)

        cy.get('h2').should('contain.text', 'Dispute details')

        cy.get('.govuk-summary-list__row')
          .eq(15)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Status')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Dispute lost to user')
          })

        cy.get('.govuk-summary-list__row')
          .eq(16)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Date disputed')
            cy.get('.govuk-summary-list__value').should('contain.text', `22 Nov 25 - 03:14:15 (GMT)`)
          })

        cy.get('.govuk-summary-list__row')
          .eq(17)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Disputed amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '£10.00')
          })

        cy.get('.govuk-summary-list__row')
          .eq(18)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Provider dispute fee')
            cy.get('.govuk-summary-list__value').should('contain.text', '£20.00')
            cy.get('.govuk-details__summary-text').should('contain.text', 'What is this fee?')
            cy.get('.govuk-details__text').contains(
              `If you lose a payment dispute, Stripe will deduct the disputed amount and an additional £20.00 dispute fee from your account.`
            )
          })

        cy.get('.govuk-summary-list__row')
          .eq(19)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Dispute net amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '-£30.00')
          })

        cy.get('.govuk-summary-list__row')
          .eq(20)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Reason')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Fraudulent')
          })

        cy.get('.govuk-summary-list__row')
          .eq(21)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Evidence due by')
            cy.get('.govuk-summary-list__value').should('contain.text', '22 Dec 25 - 03:14:15 (GMT)')
          })
      })
    })
  })
})
