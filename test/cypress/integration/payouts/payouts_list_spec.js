const SESSION_USER_ID = 'some-user-id'
const GATEWAY_ACCOUNT_ID = 10
const NUMBER_OF_HEADER_ROWS = 1

function getStubsForPayoutScenario (payouts = []) {
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
      gateway_account_id: GATEWAY_ACCOUNT_ID
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
    cy.get('#payout-list').find('tr').should('have.length', NUMBER_OF_HEADER_ROWS + payouts.length)
  })
})
