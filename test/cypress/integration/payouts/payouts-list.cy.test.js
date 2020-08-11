const SESSION_USER_ID = 'some-user-id'
const GATEWAY_ACCOUNT_ID = 10

const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')

function getStubsForPayoutScenario (payouts = [], payoutOpts = {}) {
  return [
    userStubs.getUserSuccess({
      userExternalId: SESSION_USER_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: 'some-service-name',
      email: 'some-user@email.com'
    }),
    gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: GATEWAY_ACCOUNT_ID, paymentProvider: 'stripe', type: 'live' }),
    {
      name: 'getLedgerPayoutSuccess',
      opts: {
        payouts,
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        ...payoutOpts
      }
    }]
}

describe('Payout list page', () => {
  beforeEach(() => cy.setEncryptedCookies(SESSION_USER_ID, GATEWAY_ACCOUNT_ID))

  it('should correctly display payouts given a successful response from Ledger', () => {
    const payouts = [
      { gatewayAccountId: GATEWAY_ACCOUNT_ID, paidOutDate: '2019-01-29T08:00:00.000000Z' }
    ]
    cy.task('setupStubs', getStubsForPayoutScenario(payouts))

    cy.visit('/payments-to-your-bank-account')
    cy.get('#payout-list').find('tr').should('have.length', 2)
    cy.get('#pagination').should('not.exist')
  })

  it('pagination component should correclty link for a large set', () => {
    const payouts = [
      { gatewayAccountId: GATEWAY_ACCOUNT_ID, paidOutDate: '2019-01-28T08:00:00.000000Z' },
      { gatewayAccountId: GATEWAY_ACCOUNT_ID, paidOutDate: '2019-01-28T08:00:00.000000Z' }
    ]
    const page = 2
    cy.task('setupStubs', getStubsForPayoutScenario(payouts, { total: 80, page }))

    cy.visit(`/payments-to-your-bank-account?page=${page}`)

    cy.get('#payout-list').find('tr').should('have.length', 3)

    cy.get('#pagination').should('exist')
    cy.get(`.pagination .${page}`).should('have.class', 'active')
    cy.get('.pagination').should('have.length', 8)
  })
})
