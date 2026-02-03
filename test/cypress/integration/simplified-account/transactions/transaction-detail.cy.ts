import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { DateTime } from 'luxon'
import { ResourceType } from '@models/transaction/types/resource-type'
import { penceToPoundsWithCurrency } from '@utils/currency-formatter'
import { SANDBOX } from '@models/constants/payment-providers'
import changeCase from 'change-case'

const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const CREATED_TIMESTAMP = DateTime.fromISO('2026-02-02T10:06:17.152Z')
const FORMATTED_CREATED_TIMESTAMP = CREATED_TIMESTAMP.toFormat('dd MMM yyyy HH:mm:ss')

const createTransaction = (includeAuthSummary: boolean, includeCardDetails: boolean, threeDSecureRequired?: boolean, walletType?: string) => ({
  amount: 15049,
  transaction_id: '9q0fkobhsiu7jgfcrfuhrt52co',
  reference: 'REF1888888',
  created_date: CREATED_TIMESTAMP,
  description: 'new passport',
  state: { finished: true, status: 'success' },
  wallet_type: walletType,
  transactionType: ResourceType.PAYMENT,
  ...(includeAuthSummary && {
    authorisation_summary: {
      three_d_secure: {
        required: threeDSecureRequired
      }
    }
  }),
  events: [{
    amount: 1250,
    state: {
      finished: false,
      status: 'created'
    },
    resource_type: 'PAYMENT',
    event_type: 'PAYMENT_CREATED',
    timestamp: CREATED_TIMESTAMP,
    data: {}
  }]
})

const TRANSACTION = createTransaction(true, true, true)

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
        events: TRANSACTION.events
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
        events: TRANSACTION.events
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
        events: TRANSACTION.events
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
        cy.get('.govuk-summary-list__value').should('contain.text', CREATED_TIMESTAMP.toFormat('dd LLL yyyy — HH:mm:ss'))
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
        cy.get('.govuk-summary-list__key').should('contain.text', '3D Secure (3DS)')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Required')
      })

    cy.get('.govuk-summary-list__row')
      .eq(6)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment amount')
        cy.get('.govuk-summary-list__value').should('contain.text', penceToPoundsWithCurrency(TRANSACTION.amount))
      })

    cy.get('.govuk-summary-list__row')
      .eq(7)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment type')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Card')
      })

    cy.get('.govuk-summary-list__row')
      .eq(8)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card brand')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Visa')
      })

    cy.get('.govuk-summary-list__row')
      .eq(9)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Name on card')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Test User')
      })

    cy.get('.govuk-summary-list__row')
      .eq(10)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card number')
        cy.get('.govuk-summary-list__value').should('contain.text', '0002')
      })

    cy.get('.govuk-summary-list__row')
      .eq(11)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Card expiry date')
        cy.get('.govuk-summary-list__value').should('contain.text', '08/23')
      })

    cy.get('.govuk-summary-list__row')
      .eq(12)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Email')
        cy.get('.govuk-summary-list__value').should('contain.text', 'test2@example.org')
      })

    cy.get('.govuk-summary-list__row')
      .eq(13)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Provider')
        cy.get('.govuk-summary-list__value').should('contain.text', changeCase.upperCaseFirst(SANDBOX))
      })

    cy.get('.govuk-summary-list__row')
      .eq(14)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'GOV.UK Pay ID')
        cy.get('.govuk-summary-list__value').should('contain.text', TRANSACTION.transaction_id)
      })
  })

  it('should not display 3D Secure when authorisation summary does not exist', () => {
    const transactionWithNoAuthSummary = createTransaction(false, true)
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: transactionWithNoAuthSummary,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: transactionWithNoAuthSummary.transaction_id,
        events: transactionWithNoAuthSummary.events
      })
    ])
    cy.visit(TRANSACTION_URL(TEST))
    cy.get('.govuk-summary-list__key').contains('3D Secure (3DS)').should('not.exist')
  })

  it('should display 3D Secure as not required', () => {
    const transactionWith3DSNotRequired = createTransaction(true, false)
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: transactionWith3DSNotRequired,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: transactionWith3DSNotRequired.transaction_id,
        events: transactionWith3DSNotRequired.events
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
    const transactionWithWalletType = createTransaction(true, true, undefined, 'APPLE_PAY')
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      transactionStubs.getLedgerTransactionSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionDetails: transactionWithWalletType,
      }),
      transactionStubs.getLedgerEventsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactionId: transactionWithWalletType.transaction_id,
        events: transactionWithWalletType.events
      })
    ])
    cy.visit(TRANSACTION_URL(TEST))

    cy.get('.govuk-summary-list__row')
      .eq(7)
      .within(() => {
        cy.get('.govuk-summary-list__key').should('contain.text', 'Payment type')
        cy.get('.govuk-summary-list__value').should('contain.text', 'Apple Pay')
      })
  })
})
