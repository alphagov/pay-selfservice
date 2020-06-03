const SESSION_USER_ID = 'some-user-id'
const GATEWAY_ACCOUNT_ID = 10

function getStubsForPayoutScenario (payouts = [], payoutOpts = {}) {
  return [{
    name: 'getUserSuccess',
    opts: {
      external_id: SESSION_USER_ID,
      email: 'some-user@email.com',
      service_roles: [{
        service: {
          name: 'some-service-name',
          gateway_account_ids: [ GATEWAY_ACCOUNT_ID ]
        }
      }]
    }
  }, {
    name: 'getGatewayAccountsSuccess',
    opts: {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: 'stripe',
      type: 'live'
    }
  }, {
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

    cy.visit('/payouts')
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

    cy.visit(`/payouts?page=${page}`)

    cy.get('#payout-list').find('tr').should('have.length', 3)

    cy.get('#pagination').should('exist')
    cy.get(`.pagination .${page}`).should('have.class', 'active')
    cy.get('.pagination').should('have.length', 8)
  })
})
