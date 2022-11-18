const inviteStubs = require('../../stubs/invite-stubs')

const inviteCode = 'an-invite-code'

describe('Register', () => {
  it('should complete registration journey', () => {
    cy.task('setupStubs', [
      inviteStubs.getInviteSuccess({
        code: inviteCode,
        password_set: false
      })
    ])

    // visit the invite link to get the register_invite cookie set
    cy.visit(`/invites/${inviteCode}`)

    // TODO: when the journey is hooked up, the previous route should redirect to the set password page but for now
    // we need to manually visit to start the new journey
    cy.visit('/register/password')

    cy.get('title').should('contain', 'Create your password - GOV.UK Pay')
    cy.get('h1').should('contain', 'Create your password')

    // submit the page without entering anything
    cy.get('button').contains('Continue').click()

    // check that an error messages are displayed
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('h2').should('contain', 'There is a problem')
      cy.get('[data-cy=error-summary-list-item]').should('have.length', 2)
      cy.get('[data-cy=error-summary-list-item]').eq(0)
        .contains('Enter a password')
        .should('have.attr', 'href', '#password')
      cy.get('[data-cy=error-summary-list-item]').eq(1)
        .contains('Re-type your password')
        .should('have.attr', 'href', '#repeat-password')
    })
    cy.get('title').should('contain', 'Create your password - GOV.UK Pay')

    cy.get('.govuk-form-group--error > input#password').parent().should('exist').within(() => {
      cy.get('.govuk-error-message').should('contain', 'Enter a password')
    })
    cy.get('.govuk-form-group--error > input#repeat-password').parent().should('exist').within(() => {
      cy.get('.govuk-error-message').should('contain', 'Re-type your password')
    })

    // enter valid values into both password fields and click continue
    cy.get('#password').type('long-enough-password', { delay: 0 })
    cy.get('#repeat-password').type('long-enough-password', { delay: 0 })
    cy.get('button').contains('Continue').click()

    // should redirect to next page
    cy.get('title').should('contain', 'Choose how to get security codes - GOV.UK Pay')
  })
})
