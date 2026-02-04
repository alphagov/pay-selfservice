import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { DateTime } from 'luxon'
import { ResourceType } from '@models/transaction/types/resource-type'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { SANDBOX } from '@models/constants/payment-providers'
import changeCase from 'change-case'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { AuthorisationSummaryFixture } from '@test/fixtures/transaction/authorisation-summary.fixture'

const TRANSACTION = new TransactionFixture().toTransactionData()
const TRANSACTION_CREATED_TIMESTAMP = DateTime.fromISO(TRANSACTION.created_date)

const TRANSACTION_EVENTS = [{
  amount: 1250,
  state: {
    finished: false,
    status: 'created'
  },
  resource_type: 'PAYMENT',
  event_type: 'PAYMENT_CREATED',
  timestamp: TRANSACTION_CREATED_TIMESTAMP,
  data: {}
}]

const FORMATTED_CREATED_TIMESTAMP = DateTime.fromISO(TRANSACTION.created_date).toFormat('dd MMM yyyy HH:mm:ss')
const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gateway_account_id
const SERVICE_EXTERNAL_ID = TRANSACTION.service_id
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTION_URL = (serviceMode: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/transactions/${TRANSACTION.transaction_id}`

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({
    userExternalId: USER_EXTERNAL_ID,
    email: USER_EMAIL,
    serviceExternalId: SERVICE_EXTERNAL_ID,
    gatewayAccountId: GATEWAY_ACCOUNT_ID,
    serviceName: SERVICE_NAME,
  }),
  gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, GatewayAccountType.TEST, {
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  }),
]

describe('Transaction details page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  it('accessibility check', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: TRANSACTION,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: TRANSACTION.transaction_id,
        events: TRANSACTION_EVENTS
      })
    ])
    cy.visit(TRANSACTION_URL(TEST))
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: TRANSACTION,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: TRANSACTION.transaction_id,
        events: TRANSACTION_EVENTS
      })
    ])

    cy.visit(TRANSACTION_URL(TEST))

    cy.title().should('eq', `Transaction details - ${FORMATTED_CREATED_TIMESTAMP} - ${TRANSACTION.reference} - ${SERVICE_NAME.en} - GOV.UK Pay`)
    cy.get('h1').should('contain.text', 'Transaction Details')
    cy.get('h2').should('contain.text', 'Amount')
    cy.get('h2').should('contain.text', 'Payment method')
    cy.get('h2').should('contain.text', 'Payment provider')
  })

  it('should display transaction details correctly', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: TRANSACTION,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: TRANSACTION.transaction_id,
        events: TRANSACTION_EVENTS
      })
    ])

    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(0)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Reference number')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.reference)
      })

    cy.get('.govuk-summary-list__row')
      .eq(1)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Service name')
        cy.get('.govuk-summary-list__value').should('contain.text', SERVICE_NAME.en)
      })

    cy.get('.govuk-summary-list__row')
      .eq(2)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Description')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.description)
      })

    cy.get('.govuk-summary-list__row')
      .eq(3)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Date created')
        cy.get('.govuk-summary-list__value').should('contain.text',
          DateTime.fromISO(TRANSACTION.created_date).toFormat('dd LLL yyyy — HH:mm:ss'))
      })

    cy.get('.govuk-summary-list__row')
      .eq(4)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment status')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Successful')
      })

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain.text', penceToPoundsWithCurrency(TRANSACTION.amount))
      })

    cy.get('.govuk-summary-list__row')
      .eq(6)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment type')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Card')
      })

    cy.get('.govuk-summary-list__row')
      .eq(7)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card brand')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Visa')
      })

    cy.get('.govuk-summary-list__row')
      .eq(8)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Name on card')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Test User')
      })

    cy.get('.govuk-summary-list__row')
      .eq(9)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card number')
        cy.get('.govuk-summary-list__value').should('contain.text', '0002')
      })

    cy.get('.govuk-summary-list__row')
      .eq(10)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card expiry date')
        cy.get('.govuk-summary-list__value').should('contain.text', '08/23')
      })

    cy.get('.govuk-summary-list__row')
      .eq(11)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Email')
        cy.get('.govuk-summary-list__value').should('contain.text', 'test2@example.org')
      })

    cy.get('.govuk-summary-list__row')
      .eq(12)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider')
        cy.get('.govuk-summary-list__value').should('contain.text', changeCase.upperCaseFirst(SANDBOX))
      })

    cy.get('.govuk-summary-list__row')
      .eq(13)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider ID')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.gateway_transaction_id)
      })

    cy.get('.govuk-summary-list__row')
      .eq(14)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'GOV.UK Pay ID')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.transaction_id)
      })

    cy.get('.govuk-summary-list__key').contains('3D Secure (3DS)').should('not.exist')
  })

  it('should display 3D Secure required when authorisation summary exists', () => {
    const transactionWith3DSRequired = new TransactionFixture({
      authorisationSummary: new AuthorisationSummaryFixture({
        threeDSecure: {
          required: true
        }
      })
    }).toTransactionData()

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: transactionWith3DSRequired
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: transactionWith3DSRequired.transaction_id,
        events: TRANSACTION_EVENTS
      })
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', '3D Secure (3DS)')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Required')
      })
  })

  it('should display 3D Secure as not required when authorisation summary exists', () => {
    const transactionWith3DSNotRequired = new TransactionFixture({
      authorisationSummary: new AuthorisationSummaryFixture()
    }).toTransactionData()

    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: transactionWith3DSNotRequired
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: transactionWith3DSNotRequired.transaction_id,
        events: TRANSACTION_EVENTS
      })
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(5)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', '3D Secure (3DS)')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Not required')
      })
  })

  it('should display wallet type when present', () => {
    const transactionWithWalletType = new TransactionFixture({ walletType: 'APPLE_PAY' }).toTransactionData()
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: transactionWithWalletType,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: transactionWithWalletType.transaction_id,
        events: TRANSACTION_EVENTS
      })
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(6)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment type')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Apple Pay')
      })
  })
})
