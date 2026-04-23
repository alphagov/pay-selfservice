import userStubs from '@test/cypress/stubs/user-stubs'
import gatewayAccountStubs, { getCardTypesSuccess } from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { LIVE, TEST } from '@models/gateway-account/gateway-account-type'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { getTransactionForGatewayAccount } from '@test/cypress/stubs/simplified-account/transaction-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { DateTime } from 'luxon'

const TRANSACTION_CREATED_TIMESTAMP = DateTime.fromISO('2025-07-22T03:14:15.926+01:00')
const TRANSACTION = new TransactionFixture({ createdDate: TRANSACTION_CREATED_TIMESTAMP })

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_GATEWAY_ACCOUNT_ID = '1'
const TEST_GATEWAY_ACCOUNT_ID = '2'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}
const USER_EMAIL = 's.mcduck@example.com'

const TEST_TRANSACTIONS_LIST_URL = `/transactions/${TEST}`
const LIVE_TRANSACTIONS_LIST_URL = `/transactions/${LIVE}`

const HEADING_SUFFIX = 'transactions: all services'

describe('All service transactions index', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    cy.task('setupStubs', [
      getTransactionForGatewayAccount(LIVE_GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
      getCardTypesSuccess(),
      userStubs.getUserSuccess({
        userExternalId: USER_EXTERNAL_ID,
        email: USER_EMAIL,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
        serviceName: SERVICE_NAME,
      }),
    ])
  })

  describe('Live page content', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
      ])
    })

    it('accessibility check', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [LIVE],
          gatewayAccountIds: [LIVE_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(LIVE_TRANSACTIONS_LIST_URL)
      cy.a11yCheck()
    })

    it('should display correct page title and heading', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [LIVE],
          gatewayAccountIds: [LIVE_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(LIVE_TRANSACTIONS_LIST_URL)

      const heading = `Live ${HEADING_SUFFIX}`

      cy.title().should('eq', `${heading} - GOV.UK Pay`)
      cy.get('h1').should('contain.text', heading)
    })

    it('should not show link to test mode if no test accounts exist', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [LIVE],
          gatewayAccountIds: [LIVE_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(LIVE_TRANSACTIONS_LIST_URL)

      cy.contains('a.govuk-link', 'View test transactions').should('not.exist')
    })

    it('should navigate to test transactions', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
        gatewayAccountStubs.getGatewayAccountByServiceIdsSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          type: TEST,
          gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
        }),
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [LIVE, TEST],
          gatewayAccountIds: [LIVE_GATEWAY_ACCOUNT_ID, TEST_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(LIVE_TRANSACTIONS_LIST_URL)

      cy.contains('a.govuk-link', 'View test transactions').should('be.visible').click()
      cy.get('h1').should('contain.text', `Test ${HEADING_SUFFIX}`)
      cy.url().should('include', TEST_TRANSACTIONS_LIST_URL)
    })
  })

  describe('Test page content', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({
          userExternalId: USER_EXTERNAL_ID,
          email: USER_EMAIL,
          serviceExternalId: SERVICE_EXTERNAL_ID,
          gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
          serviceName: SERVICE_NAME,
        }),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
        gatewayAccountStubs.getGatewayAccountByServiceIdsSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          type: TEST,
          gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
        }),
      ])
    })

    it('accessibility check', () => {
      cy.task('setupStubs', [
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [TEST],
          gatewayAccountIds: [TEST_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(TEST_TRANSACTIONS_LIST_URL)
      cy.a11yCheck()
    })

    it('should display correct page title and headings', () => {
      cy.task('setupStubs', [
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [TEST],
          gatewayAccountIds: [TEST_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(TEST_TRANSACTIONS_LIST_URL)
      const heading = `Test ${HEADING_SUFFIX}`

      cy.title().should('eq', `${heading} - GOV.UK Pay`)
      cy.get('h1').should('contain.text', heading)
    })

    it('should not show link to live mode if no live accounts exist', () => {
      cy.task('setupStubs', [
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [TEST],
          gatewayAccountIds: [TEST_GATEWAY_ACCOUNT_ID],
        }),
      ])
      cy.visit(TEST_TRANSACTIONS_LIST_URL)

      cy.contains('a.govuk-link', 'View live transactions').should('not.exist')
      cy.url().should('include', TEST_TRANSACTIONS_LIST_URL)
    })

    it('should navigate to live transactions', () => {
      cy.task('setupStubs', [
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
          transactions: [TRANSACTION],
          filters: { from_date: last12MonthsStartDate },
          displaySize: 20,
          transactionLength: 1,
        }),
        gatewayAccountStubs.getGatewayAccountsByServiceIdAndTypeSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          types: [LIVE, TEST],
          gatewayAccountIds: [LIVE_GATEWAY_ACCOUNT_ID, TEST_GATEWAY_ACCOUNT_ID],
        }),
        gatewayAccountStubs.getGatewayAccountByServiceIdsSuccess({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          type: LIVE,
          gatewayAccountId: LIVE_GATEWAY_ACCOUNT_ID,
        }),
      ])
      cy.visit(TEST_TRANSACTIONS_LIST_URL)

      cy.contains('a.govuk-link', 'View live transactions').should('be.visible').click()
      cy.get('h1').should('contain.text', `Live ${HEADING_SUFFIX}`)
      cy.url().should('include', LIVE_TRANSACTIONS_LIST_URL)
    })
  })
})
