import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs, { getCardTypesSuccess } from '@test/cypress/stubs/gateway-account-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import {
  getTransactionEvents,
  getTransactionForGatewayAccount,
} from '@test/cypress/stubs/simplified-account/transaction-stubs'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import { TITLE_FRIENDLY_DATE_TIME } from '@models/constants/time-formats'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import ROLES from '@test/fixtures/roles.fixtures'

const TRANSACTION = new TransactionFixture()
const TRANSACTION_CREATED_TIMESTAMP = TRANSACTION.createdDate

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

const ALL_SERVICES_TRANSACTION_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/all-services/transactions/${TRANSACTION.externalId}`
const ALL_SERVICES_TRANSACTIONS_LIST_URL = `/transactions/${TEST}`

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

describe('All services transaction details page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getTransactionEvents(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION_EVENTS),
      getCardTypesSuccess(),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactions: [TRANSACTION],
        filters: { from_date: last12MonthsStartDate },
        displaySize: 20,
        transactionLength: 1,
      }),
    ])
  })

  it('accessibility check', () => {
    cy.visit(ALL_SERVICES_TRANSACTION_URL)
    cy.a11yCheck()
  })

  it('should display correct page title and headings', () => {
    const title = 'Transaction details'

    cy.visit(ALL_SERVICES_TRANSACTION_URL)

    cy.title().should(
      'eq',
      `${title} - ${TRANSACTION.createdDate.toFormat(TITLE_FRIENDLY_DATE_TIME)} - ${TRANSACTION.reference} - GOV.UK Pay`
    )
    cy.get('h1').should('contain.text', title)
  })

  it('should navigate to transactions list page when back link is clicked', () => {
    cy.task('setupStubs', [
      gatewayAccountStubs.getGatewayAccountByServiceIdsSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        type: 'test',
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
      }),
    ])

    cy.visit(ALL_SERVICES_TRANSACTION_URL)
    cy.get('.govuk-back-link').click()

    cy.url().should('include', ALL_SERVICES_TRANSACTIONS_LIST_URL)
  })

  it('should navigate to all services refund page when button is clicked', () => {
    cy.visit(ALL_SERVICES_TRANSACTION_URL)

    cy.contains('a.govuk-button', 'Refund payment').should('be.visible').click()

    const refundUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/all-services/transactions/${TRANSACTION.externalId}/refund`

    cy.url().should('include', refundUrl)
  })
})
