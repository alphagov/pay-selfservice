'use strict'

const userStubs = require('../../stubs/user-stubs')

const authenticatedUserId = 'authenticated-user-id'

function getUserAndAccountStubs (type, paymentProvider) {
  return [userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' })
  ]
}

describe('Feedback page', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
    cy.task('setupStubs', getUserAndAccountStubs('live', 'stripe'))
  })

  it('should display Feedback page', () => {
    cy.setEncryptedCookies(authenticatedUserId, 1)
    cy.visit('/feedback')

    cy.title().should('eq', 'Give feedback — GOV.UK Pay')
    cy.get('.govuk-back-link').contains('My services')
  })

  it('should submit Feedback form and display Success notification', () => {
    cy.get('button').contains('Send feedback').click()
    cy.get('.govuk-notification-banner__content').contains('Thanks for your feedback')
  })
})
