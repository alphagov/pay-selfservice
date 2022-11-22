const inviteStubs = require('../../stubs/invite-stubs')

const inviteCode = 'an-invite-code'
const otpKey = 'ANEXAMPLESECRETSECONDFACTORCODE1'

describe('Register', () => {
  describe('SMS is selected as method for getting security codes', () => {
    it('should complete registration journey', () => {
      cy.task('setupStubs', [
        inviteStubs.getInviteSuccess({
          code: inviteCode,
          password_set: false,
          otp_key: otpKey
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

      // don't select an option and click continue
      cy.get('button').contains('Continue').click()

      // check that error messages are displayed
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').eq(0)
          .contains('You need to select an option')
          .should('have.attr', 'href', '#sign-in-method')
      })
      cy.get('title').should('contain', 'Choose how to get security codes - GOV.UK Pay')

      cy.get('[data-cy=radios-security-code]').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'You need to select an option')
      })

      // select SMS and click continue
      cy.get('[data-cy=radio-option-sms]').click()
      cy.get('button').contains('Continue').click()

      // should redirect to phone number page
      cy.get('title').should('contain', 'Enter your mobile phone number - GOV.UK Pay')
    })
  })

  describe('APP is selected as method for getting security codes', () => {
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

      // enter valid values into both password fields and click continue
      cy.get('#password').type('long-enough-password', { delay: 0 })
      cy.get('#repeat-password').type('long-enough-password', { delay: 0 })
      cy.get('button').contains('Continue').click()

      // should redirect to next page
      cy.get('title').should('contain', 'Choose how to get security codes - GOV.UK Pay')

      // select APP and click continue
      cy.get('[data-cy=radio-option-app]').click()
      cy.get('button').contains('Continue').click()

      // should redirect to authenticator app page
      cy.get('title').should('contain', 'Set up an authenticator app - GOV.UK Pay')

      cy.get('[data-cy=qr]').should('have.attr', 'src').then(src => {
        expect(src).to.contain('data:image')
      })
      cy.get('[data-cy=otp-secret]').should('have.text', 'ANEX AMPL ESEC RETS ECON DFAC TORC ODE1')
    })
  })
})
