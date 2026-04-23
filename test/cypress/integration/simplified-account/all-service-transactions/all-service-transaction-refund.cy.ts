import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionEvents,
  getTransactionForGatewayAccount,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import ROLES from '@test/fixtures/roles.fixtures'
import { DateTime } from 'luxon'

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

const TRANSACTION_DETAIL_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/all-services/transactions/${TRANSACTION.externalId}`
const TRANSACTION_REFUND_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/all-services/transactions/${TRANSACTION.externalId}/refund`

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
})
