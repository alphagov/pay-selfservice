import userStubs from '@test/cypress/stubs/user-stubs'
import { GatewayAccountType } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionEvents,
  getTransactionForGatewayAccount,
  postRefund,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import ROLES from '@test/fixtures/roles.fixtures'
import { DateTime } from 'luxon'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'

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

const TRANSACTION_EVENTS = [
  new TransactionEventFixture({
    amount: 1250,
    state: {
      finished: false,
      status: 'CREATED',
    },
    resourceType: 'PAYMENT',
    eventType: 'PAYMENT_CREATED',
    timestamp: TRANSACTION.createdDate,
  }),
]

const TRANSACTION_DETAIL_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/all-services/transactions/${TRANSACTION.externalId}`
const TRANSACTION_REFUND_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/all-services/transactions/${TRANSACTION.externalId}/refund`

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

describe('All services refund page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])
  })

  it('accessibility check', () => {
    cy.visit(TRANSACTION_REFUND_URL)
    cy.a11yCheck({ exclude: ['.govuk-skip-link', '.govuk-radios__input'] }) // https://accessibility.blog.gov.uk/2021/09/21/an-update-on-the-accessibility-of-conditionally-revealed-questions/
  })

  it('should display correct page title and headings', () => {
    cy.visit(TRANSACTION_REFUND_URL)
    cy.title().should('eq', `Refund - 22 Jul 2025 03:14:15 - ${TRANSACTION.reference} - GOV.UK Pay`)
    cy.get('h1').should('contain.text', 'Refund')
  })

  it('should navigate to transaction detail page when back link is clicked', () => {
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
    ])

    cy.visit(TRANSACTION_REFUND_URL)
    cy.get('.govuk-back-link').click()

    cy.url().should('include', TRANSACTION_DETAIL_URL)
  })

  it('should navigate to transaction detail page when refund is made', () => {
    const refundAmount = TRANSACTION.amount

    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
      postRefund(SERVICE_EXTERNAL_ID, TRANSACTION.externalId).success(
        refundAmount,
        TRANSACTION,
        USER_EXTERNAL_ID,
        USER_EMAIL
      ),
    ])

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment').check()
    cy.get('.govuk-radios__hint')
      .first()
      .should(
        'contain',
        `Refund the full amount of ${penceToPoundsWithCurrency(TRANSACTION.refundSummary.amountAvailable)}`
      )
    cy.contains('Confirm refund').should('be.visible').click()
    cy.get('.govuk-notification-banner--success')
      .should('be.visible')
      .and('contain', 'Refund successful')
      .and('contain', 'It may take up to six days to process')

    cy.url().should('include', TRANSACTION_DETAIL_URL)
  })

  it('should display error when no amount is entered for partial refund', () => {
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])

    const errorMessage = 'Enter a refund amount'

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment-2').check()
    cy.contains('Confirm refund').should('be.visible').click()

    cy.get('.govuk-error-summary')
      .should('exist')
      .should('contain.text', 'There is a problem')
      .should('contain.text', errorMessage)
    cy.get('.govuk-error-message').should('exist').should('contain.text', errorMessage)
  })

  it('should display error when amount entered is too high for partial refund', () => {
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])

    const errorMessage = `Enter a refund amount greater than ${penceToPoundsWithCurrency(0)} and less than ${penceToPoundsWithCurrency(TRANSACTION.amount)}`

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment-2').check()
    cy.get('#partial-refund-amount').click().focused().clear().type(TRANSACTION.amount.toString())

    cy.contains('Confirm refund').should('be.visible').click()
    cy.get('.govuk-error-summary')
      .should('exist')
      .should('contain.text', 'There is a problem')
      .should('contain.text', errorMessage)
    cy.get('.govuk-error-message').should('exist').should('contain.text', errorMessage)
  })

  it('should display error when amount entered is incorrectly formatted', () => {
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])

    const errorMessage = `Enter an amount to refund in pounds and pence using digits and a decimal point. For example “10.50”`

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment-2').check()
    cy.get('#partial-refund-amount').click().focused().clear().type('.50')

    cy.contains('Confirm refund').should('be.visible').click()
    cy.get('.govuk-error-summary')
      .should('exist')
      .should('contain.text', 'There is a problem')
      .should('contain.text', errorMessage)
    cy.get('.govuk-error-message').should('exist').should('contain.text', errorMessage)
  })

  it('should display error when neither radio button is checked', () => {
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])

    const errorMessage = `Select an option`

    cy.visit(TRANSACTION_REFUND_URL)

    cy.contains('Confirm refund').should('be.visible').click()
    cy.get('.govuk-error-summary')
      .should('exist')
      .should('contain.text', 'There is a problem')
      .should('contain.text', errorMessage)
    cy.get('.govuk-error-message').should('exist').should('contain.text', errorMessage)
  })
})
