const inviteStubs = require('../../stubs/invite-stubs')
const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const inviteCode = 'an-invite-code'
const otpKey = 'ANEXAMPLESECRETSECONDFACTORCODE1'
const createdUserExternalId = 'a-user-id'

describe('Register', () => {
  describe('SMS is selected as method for getting security codes', () => {
    it('should complete registration journey', () => {
      cy.task('setupStubs', [
        inviteStubs.getInviteSuccess({
          code: inviteCode,
          password_set: false,
          otp_key: otpKey,
          telephone_number: '+4408081570192'
        }),
        inviteStubs.completeInviteSuccess(inviteCode, createdUserExternalId),
        userStubs.getUserSuccess({ userExternalId: createdUserExternalId, gatewayAccountId: '1' }),
        gatewayAccountStubs.getGatewayAccountsSuccess({
          gatewayAccountId: '1'
        })
      ])

      // visit the invite link to get the register_invite cookie set
      cy.visit(`/invites/${inviteCode}`)

      // TODO: when the journey is hooked up, the previous route should redirect to the set password page but for now
      // we need to manually visit to start the new journey
      cy.visit('/register/password')

      cy.title().should('eq', 'Create your password - GOV.UK Pay')
      cy.get('h1').should('contain', 'Create your password')

      // submit the page without entering anything
      cy.get('button').contains('Continue').click()

      // check that error messages are displayed
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
      cy.title().should('eq', 'Create your password - GOV.UK Pay')

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
      cy.title().should('eq', 'Choose how to get security codes - GOV.UK Pay')

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
      cy.title().should('eq', 'Choose how to get security codes - GOV.UK Pay')

      cy.get('[data-cy=radios-security-code]').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'You need to select an option')
      })

      // select SMS and click continue
      cy.get('[data-cy=radio-option-sms]').click()
      cy.get('button').contains('Continue').click()

      // should redirect to phone number page
      cy.title().should('eq', 'Enter your mobile phone number - GOV.UK Pay')

      // enter an invalid phone number
      cy.get('#phone').type('x', { delay: 0 })
      cy.get('button').contains('Continue').click()

      // check that an error message is displayed
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').eq(0)
          .contains('Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
          .should('have.attr', 'href', '#phone')
      })
      cy.get('.govuk-form-group--error > input#phone').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
      })
      cy.get('#phone').should('have.value', 'x')
      cy.title().should('eq', 'Enter your mobile phone number - GOV.UK Pay')

      // enter a valid phone number
      cy.get('#phone').type('+44 0808 157 0192', { delay: 0 })
      cy.get('button').contains('Continue').click()

      // should show page to enter code
      cy.title().should('eq', 'Check your phone - GOV.UK Pay')
      cy.get('.govuk-inset-text').should('contain', 'We have sent a code to ••••••••••0192.')

      // click continue without entering a code
      cy.get('button').contains('Continue').click()

      // check that error message is displayed
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').eq(0)
          .contains('Enter your security code')
          .should('have.attr', 'href', '#code')
      })
      cy.title().should('eq', 'Check your phone - GOV.UK Pay')

      cy.get('#code').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter your security code')
      })

      // enter a valid code and click continue
      cy.get('#code').type('123456')
      cy.get('button').contains('Continue').click()

      // should log user in and redirect to my services page
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })

  describe('APP is selected as method for getting security codes', () => {
    it('should complete registration journey', () => {
      cy.task('setupStubs', [
        inviteStubs.getInviteSuccess({
          code: inviteCode,
          password_set: false,
          otp_key: otpKey
        }),
        inviteStubs.completeInviteSuccess(inviteCode, createdUserExternalId),
        userStubs.getUserSuccess({ userExternalId: createdUserExternalId, gatewayAccountId: '1' }),
        gatewayAccountStubs.getGatewayAccountsSuccess({
          gatewayAccountId: '1'
        })
      ])

      // visit the invite link to get the register_invite cookie set
      cy.visit(`/invites/${inviteCode}`)

      // TODO: when the journey is hooked up, the previous route should redirect to the set password page but for now
      // we need to manually visit to start the new journey
      cy.visit('/register/password')

      cy.title().should('eq', 'Create your password - GOV.UK Pay')
      cy.get('h1').should('contain', 'Create your password')

      // enter valid values into both password fields and click continue
      cy.get('#password').type('long-enough-password', { delay: 0 })
      cy.get('#repeat-password').type('long-enough-password', { delay: 0 })
      cy.get('button').contains('Continue').click()

      // should redirect to next page
      cy.title().should('eq', 'Choose how to get security codes - GOV.UK Pay')

      // select APP and click continue
      cy.get('[data-cy=radio-option-app]').click()
      cy.get('button').contains('Continue').click()

      // should redirect to authenticator app page
      cy.title().should('eq', 'Set up an authenticator app - GOV.UK Pay')

      cy.get('[data-cy=qr]').should('have.attr', 'src').then(src => {
        expect(src).to.contain('data:image')
      })
      cy.get('[data-cy=otp-secret]').should('have.text', 'ANEX AMPL ESEC RETS ECON DFAC TORC ODE1')

      // click continue without entering a code
      cy.get('button').contains('Continue').click()

      // check that error message is displayed
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').eq(0)
          .contains('Enter your security code')
          .should('have.attr', 'href', '#code')
      })
      cy.title().should('eq', 'Set up an authenticator app - GOV.UK Pay')

      cy.get('#code').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter your security code')
      })

      // enter a valid code and click continue
      cy.get('#code').type('123456')
      cy.get('button').contains('Continue').click()

      // should log user in and redirect to my services page
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })
})
