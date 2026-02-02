import userStubs from '@test/cypress/stubs/user-stubs'
import GatewayAccountType, { TEST } from '@models/gateway-account/gateway-account-type'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import transactionStubs from '@test/cypress/stubs/transaction-stubs'
import { DateTime } from 'luxon'

const USER_EXTERNAL_ID = 'user456def'
const USER_EMAIL = 's.mcduck@example.com'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_EXTERNAL_ID = 'service123abc'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const CREATED_TIMESTAMP = DateTime.fromISO('2026-02-02T10:06:17.152Z')

const TRANSACTION = {
  transaction_id: '9q0fkobhsiu7jgfcrfuhrt52co',
  reference: 'ref188888',
  created_date: CREATED_TIMESTAMP,
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
    cy.visit(TRANSACTION_URL(GatewayAccountType.TEST))
  })

  it('accessibility check', () => {
    cy.a11yCheck()
  })

  it('should display correct page title and heading', () => {
    cy.title().should('eq', `Transaction details - ${CREATED_TIMESTAMP.toFormat('dd MMM yyyy HH:mm:ss')} - ${TRANSACTION.reference} - ${SERVICE_NAME.en} - GOV.UK Pay`)
    cy.get('h1').should('contain.text', 'Transaction Details')
  })

  it('should display transaction details correctly', () => {

  })
})
