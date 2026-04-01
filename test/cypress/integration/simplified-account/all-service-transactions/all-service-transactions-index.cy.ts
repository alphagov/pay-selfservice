import userStubs from '@test/cypress/stubs/user-stubs'
import gatewayAccountStubs, { getCardTypesSuccess } from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { LIVE, TEST } from '@models/gateway-account/gateway-account-type'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { getTransactionForGatewayAccount } from '@test/cypress/stubs/simplified-account/transaction-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'

const TRANSACTION = new TransactionFixture()

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = '1'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}
const USER_EMAIL = 's.mcduck@example.com'

const TEST_TRANSACTIONS_LIST_URL = `/transactions/${TEST}`
const LIVE_TRANSACTIONS_LIST_URL = `/transactions/${LIVE}`

const HEADING_SUFFIX = 'transactions: all services'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({
    userExternalId: USER_EXTERNAL_ID,
    email: USER_EMAIL,
    serviceExternalId: SERVICE_EXTERNAL_ID,
    gatewayAccountId: GATEWAY_ACCOUNT_ID,
    serviceName: SERVICE_NAME,
  }),
]

describe('All service transactions index', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getCardTypesSuccess(),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        transactions: [TRANSACTION],
        filters: { from_date: last12MonthsStartDate },
        displaySize: 20,
        transactionLength: 1,
      }),
      gatewayAccountStubs.getGatewayAccountByServiceIdsSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        type: 'test',
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
      }),
      gatewayAccountStubs.getGatewayAccountByServiceIdsSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        type: 'live',
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
      }),
    ])
  })

  describe('Live page content', () => {
    beforeEach(() => {
      cy.visit(LIVE_TRANSACTIONS_LIST_URL)
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })

    it('should display correct heading', () => {
      const heading = `Live ${HEADING_SUFFIX}`

      cy.title().should('eq', `${heading} - GOV.UK Pay`)
      cy.get('h1').should('contain.text', heading)
    })

    it('should navigate to test transactions', () => {
      cy.contains('a.govuk-link', 'View test transactions').should('be.visible').click()
      cy.get('h1').should('contain.text', `Test ${HEADING_SUFFIX}`)
      cy.url().should('include', TEST_TRANSACTIONS_LIST_URL)
    })
  })

  describe('Test page content', () => {
    beforeEach(() => {
      cy.visit(TEST_TRANSACTIONS_LIST_URL)
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })

    it('should display correct heading', () => {
      const heading = `Test ${HEADING_SUFFIX}`

      cy.title().should('eq', `${heading} - GOV.UK Pay`)
      cy.get('h1').should('contain.text', heading)
    })

    it('should navigate to live transactions', () => {
      cy.contains('a.govuk-link', 'View live transactions').should('be.visible').click()
      cy.get('h1').should('contain.text', `Live ${HEADING_SUFFIX}`)
      cy.url().should('include', LIVE_TRANSACTIONS_LIST_URL)
    })
  })
})
