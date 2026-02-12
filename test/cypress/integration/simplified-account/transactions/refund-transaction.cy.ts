import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'

import { getTransactionForGatewayAccount } from '@test/cypress/stubs/simplified-account/transaction-stubs'

const PAGE_HEADING_DATE_FORMAT = 'dd LLLL yyyy HH:mm:ss'
const TRANSACTION = new TransactionFixture()
const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = TRANSACTION.gatewayAccountId
const SERVICE_EXTERNAL_ID = TRANSACTION.serviceExternalId
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const TRANSACTION_REFUND_URL = (serviceMode: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/transactions/${TRANSACTION.externalId}/refund`

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

describe('Refund page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      getTransactionForGatewayAccount(GATEWAY_ACCOUNT_ID, TRANSACTION.externalId).success(TRANSACTION),
    ])
  })

  it('should display correct page title and headings', () => {
    cy.visit(TRANSACTION_REFUND_URL(TEST))

    cy.title().should(
      'eq',
      `Refund - ${TRANSACTION.createdDate.toFormat(PAGE_HEADING_DATE_FORMAT)} - ${TRANSACTION.reference} - ${SERVICE_NAME.en} - GOV.UK Pay`
    )

    cy.get('h1').should('contain.text', 'Refund')
  })


  it('should navigate to transaction detail page when back link is clicked', () => {
    cy.visit(TRANSACTION_REFUND_URL(TEST))
    cy.get('.govuk-back-link').click()

    const transactionDetailUrl = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST}/transactions/${TRANSACTION.externalId}`

    cy.url().should('include', transactionDetailUrl)
  })

  it('should make full refund', () => {
    cy.visit(TRANSACTION_REFUND_URL(TEST))

    cy.get('#refund-payment').check()

    // TODO add assertions 

  })
})

