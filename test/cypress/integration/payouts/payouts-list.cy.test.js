const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const payoutStubs = require('../../stubs/payout-stubs')

const userExternalId = 'some-user-id'
const liveGatewayAccountId = 10
const testGatewayAccountId = 11

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({
    userExternalId,
    gatewayAccountIds: [liveGatewayAccountId, testGatewayAccountId],
    serviceName: 'some-service-name',
    email: 'some-user@email.com'
  }),
  gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([
    {
      gatewayAccountId: liveGatewayAccountId,
      paymentProvider: 'stripe',
      type: 'live'
    },
    {
      gatewayAccountId: testGatewayAccountId,
      paymentProvider: 'stripe',
      type: 'test'
    }
  ])
]

describe('Payout list page', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should correctly display payouts given a successful response from Ledger', () => {
    cy.setEncryptedCookies(userExternalId)

    const payouts = [
      { gatewayAccountId: liveGatewayAccountId, paidOutDate: '2019-01-29T08:00:00.000000Z' }
    ]
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: liveGatewayAccountId, payouts })
    ])

    cy.visit('/payments-to-your-bank-account')
    cy.get('h1').find('.govuk-tag').should('have.text', 'LIVE')
    cy.get('#payout-list').find('tr').should('have.length', 2)
    cy.get('#pagination').should('not.exist')
  })

  it('should have correct breadcrumb navigation', () => {
    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Payments to your bank account')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'LIVE')
    })
  })

  it('pagination component should correctly link for a large set', () => {
    const payouts = [
      { gatewayAccountId: liveGatewayAccountId, paidOutDate: '2019-01-28T08:00:00.000000Z' },
      { gatewayAccountId: liveGatewayAccountId, paidOutDate: '2019-01-28T08:00:00.000000Z' }
    ]
    const page = 2
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: liveGatewayAccountId, payouts, payoutOpts: { total: 80, page } })
    ])

    cy.visit(`/payments-to-your-bank-account?page=${page}`)

    cy.get('#payout-list').find('tr').should('have.length', 3)

    cy.get('#pagination').should('exist')
    cy.get(`.pagination .${page}`).should('have.class', 'active')
    cy.get('.pagination').should('have.length', 8)
  })

  it('should show test payouts when Switch to test is clicked', () => {
    const payouts = [
      { gatewayAccountId: testGatewayAccountId, paidOutDate: '2019-01-29T08:00:00.000000Z' }
    ]
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: testGatewayAccountId, payouts })
    ])

    cy.get('a').contains('Switch to test transactions').click()

    cy.get('h1').find('.govuk-tag').should('have.text', 'TEST')
    cy.get('.govuk-inset-text').contains('Test reports represent')
    cy.get('#payout-list').find('tr').should('have.length', 2)

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Payments to your bank account')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
    })
  })

  it('should show sample report for test account account if the test account has no payouts', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: testGatewayAccountId })
    ])

    cy.visit('/payments-to-your-bank-account/test')
    cy.get('h1').find('.govuk-tag').should('have.text', 'TEST')
    cy.get('#payout-list').find('tr').should('have.length', 2)
    cy.get('#pagination').should('not.exist')

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Payments to your bank account')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
    })
  })

  it('should show no payouts for live account if the live account has no payouts', () => {
    cy.task('setupStubs', [
      ...userAndGatewayAccountStubs,
      payoutStubs.getLedgerPayoutSuccess({ gatewayAccountId: liveGatewayAccountId })
    ])

    cy.visit('/payments-to-your-bank-account')
    cy.get('h1').find('.govuk-tag').should('have.text', 'LIVE')
    cy.get('#pagination').should('not.exist')
    cy.get('#payout-list').should('not.exist')
    cy.get('.govuk-section-break.govuk-section-break--l.govuk-section-break--visible').next('p').contains('No payments to your bank account found on or after 22 May 2020')
  })

  it('should show no permissions to access this page if the user has no stripe test accounts', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({
        userExternalId,
        gatewayAccountIds: [testGatewayAccountId],
        serviceName: 'some-service-name',
        email: 'some-user@email.com'
      }),
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([
        {
          gatewayAccountId: testGatewayAccountId,
          paymentProvider: 'sandbox',
          type: 'test'
        }
      ])
    ])

    cy.visit('/payments-to-your-bank-account/test', { failOnStatusCode: false })
    cy.get('#errorMsg').should('have.text', 'You do not have any associated services with rights to view payments to bank accounts.')
  })
})
