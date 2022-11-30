const inviteStubs = require('../../stubs/invite-stubs')

describe('Start self-signup registration', () => {
  it('should rerender page if invalid email address', () => {
    const invalidEmail = 'a@example.com'

    cy.task('setupStubs', [
      inviteStubs.createSelfSignupInviteNotPublicSectorEmail(invalidEmail)
    ])

    cy.visit('/register/email-address')

    cy.title().should('eq', 'Enter your email address - GOV.UK Pay')
    cy.get('h1').should('contain', 'Enter your email address')

    // Submit invalid email address
    cy.get('#email').type(invalidEmail, { delay: 0 })
    cy.get('button').contains('Continue').click()

    // Check that error messages are displayed
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('h2').should('contain', 'There is a problem')
      cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
      cy.get('[data-cy=error-summary-list-item]').eq(0)
        .contains('Enter a public sector email address')
        .should('have.attr', 'href', '#email')
    })

    cy.get('.govuk-form-group--error > input#email').parent().should('exist').within(() => {
      cy.get('.govuk-error-message').should('contain', 'Enter a public sector email address')
    })
    cy.get('#email').should('have.value', invalidEmail)

    cy.title().should('eq', 'Enter your email address - GOV.UK Pay')
  })

  it('proceed to check email page if valid email address', () => {
    const email = 'a@example.com'

    cy.task('setupStubs', [
      inviteStubs.createSelfSignupInviteSuccess(email)
    ])

    cy.visit('/register/email-address')

    cy.title().should('eq', 'Enter your email address - GOV.UK Pay')
    cy.get('h1').should('contain', 'Enter your email address')

    cy.get('#email').clear().type(email, { delay: 0 })
    cy.get('button').contains('Continue').click()

    // Should redirect to 'check email' page
    cy.title().should('eq', 'Check your email - GOV.UK Pay')
    cy.get('h1').should('contain', 'Check your email')

    cy.get('p').contains('An email has been sent to a@example.com').should('exist')
  })
})
