import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionEvents,
  getTransactionForGatewayAccount,
  postRefund,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { TITLE_FRIENDLY_DATE_TIME } from '@models/constants/time-formats'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { LedgerRefundSummaryFixture } from '@test/fixtures/transaction/ledger-refund-summary.fixture'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import { checkServiceNavigation } from '../common/assertions'
import ROLES from '@test/fixtures/roles.fixtures'

const TRANSACTION = new TransactionFixture()
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

const TRANSACTION_DETAIL_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${TRANSACTION.externalId}`
const TRANSACTION_REFUND_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${TRANSACTION.externalId}/refund`

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

describe('Refund page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    cy.task('setupStubs', [...userAndGatewayAccountStubs])
  })

  it('accessibility check', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])
    cy.visit(TRANSACTION_REFUND_URL)
    cy.a11yCheck({ exclude: ['.govuk-skip-link', '.govuk-radios__input'] }) // https://accessibility.blog.gov.uk/2021/09/21/an-update-on-the-accessibility-of-conditionally-revealed-questions/
  })

  it('should display correct page title and headings', () => {
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])

    cy.visit(TRANSACTION_REFUND_URL)

    const transactionListUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions`

    checkServiceNavigation('Transactions', transactionListUrl)
    cy.title().should(
      'eq',
      `Refund - ${TRANSACTION.createdDate.toFormat(TITLE_FRIENDLY_DATE_TIME)} - ${TRANSACTION.reference} - ${SERVICE_NAME.en} - GOV.UK Pay`
    )
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

  it('should make full refund successfully', () => {
    const refundAmount = TRANSACTION.amount

    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      postRefund(SERVICE_EXTERNAL_ID, TRANSACTION.externalId).success(
        refundAmount,
        TRANSACTION,
        USER_EXTERNAL_ID,
        USER_EMAIL
      ),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success([]),
    ])

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment').check()
    cy.get('.govuk-radios__hint')
      .first()
      .should(
        'contain',
        `Refund the full amount of ${penceToPoundsWithCurrency(TRANSACTION.refundSummary.amountAvailable)}`
      )
    cy.contains(' Confirm refund ').should('be.visible').click()
    cy.get('.govuk-notification-banner--success')
      .should('be.visible')
      .and('contain', 'Refund successful')
      .and('contain', 'It may take up to six days to process')
    cy.url().should('include', TRANSACTION_DETAIL_URL)
  })

  it('should display corporate surcharge in radio hint', () => {
    const transactionAmounts = { corporateCardSurcharge: 25, fee: 15, totalAmount: 1075 }
    const transactionWithFees = new TransactionFixture({ ...transactionAmounts })

    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(transactionWithFees),
    ])

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment').check()
    cy.get('.govuk-radios__hint')
      .first()
      .contains(
        `Refund the full amount of ${penceToPoundsWithCurrency(transactionWithFees.refundSummary.amountAvailable)} (including card fee of ${penceToPoundsWithCurrency(transactionAmounts.corporateCardSurcharge)})`
      )
  })

  it('should display remaining amount in radio hint', () => {
    const refundSummary = new LedgerRefundSummaryFixture({
      amountAvailable: 900,
      status: 'available',
      amountRefunded: 100,
      amountSubmitted: 0,
      userExternalId: USER_EXTERNAL_ID,
    })
    const transactionWithPartialRefund = new TransactionFixture({ refundSummary })

    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(transactionWithPartialRefund),
    ])

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment').check()
    cy.get('.govuk-radios__hint')
      .first()
      .should(
        'contain',
        `Refund the remaining amount of ${penceToPoundsWithCurrency(transactionWithPartialRefund.refundSummary.amountAvailable)}`
      )
  })

  it('should make partial refund successfully', () => {
    const partialRefundAmount = 100

    cy.task('setupStubs', [
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      postRefund(SERVICE_EXTERNAL_ID, TRANSACTION.externalId).success(
        partialRefundAmount,
        TRANSACTION,
        USER_EXTERNAL_ID,
        USER_EMAIL
      ),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success([]),
    ])

    cy.visit(TRANSACTION_REFUND_URL)

    cy.get('#refund-payment-2').check()
    cy.get('#partial-refund-amount')
      .click()
      .focused()
      .clear()
      .type((partialRefundAmount / 100).toString())
    cy.contains(' Confirm refund ').should('be.visible').click()
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
    cy.contains(' Confirm refund ').should('be.visible').click()

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

    cy.contains(' Confirm refund ').should('be.visible').click()
    cy.get('.govuk-error-summary')
      .should('exist')
      .should('contain.text', 'There is a problem')
      .should('contain.text', errorMessage)
    cy.get('.govuk-error-message').should('exist').should('contain.text', errorMessage)
  })
})
