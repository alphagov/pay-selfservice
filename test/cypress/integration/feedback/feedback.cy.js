'use strict'

const userStubs = require('../../stubs/user-stubs')
const zendeskStubs = require('../../stubs/zendesk-stubs')

const authenticatedUserId = 'authenticated-user-id'

describe('Feedback page', () => {
  it('should display Feedback page and allow submitting feedback', () => {
    cy.task('setupStubs',
      [
        userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
        zendeskStubs.createTicketSuccess()
      ])

    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/feedback')
    cy.percySnapshot()

    cy.title().should('eq', 'Give feedback — GOV.UK Pay')

    cy.get('button').contains('Send feedback').click()
    cy.get('.govuk-notification-banner__content').contains('Thanks for your feedback')
  })
})
