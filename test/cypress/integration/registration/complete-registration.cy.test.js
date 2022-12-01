const inviteStubs = require('../../stubs/invite-stubs')
const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const inviteCode = 'an-invite-code'
const otpKey = 'ANEXAMPLESECRETSECONDFACTORCODE1'
const createdUserExternalId = 'a-user-id'
const validPhoneNumber = '+4408081570192'

describe('Complete registration after following link in invite email', () => {
  describe('SMS is selected as method for getting security codes', () => {
    it('should complete registration journey', () => {
      cy.task('setupStubs', [
        inviteStubs.getInviteSuccess({
          code: inviteCode,
          password_set: false,
          otp_key: otpKey,
          telephone_number: validPhoneNumber
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

      cy.get('.govuk-form-group--error > input#password').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter a password')
      })
      cy.get('.govuk-form-group--error > input#repeat-password').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Re-type your password')
      })

      cy.title().should('eq', 'Create your password - GOV.UK Pay')

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

      cy.get('[data-cy=radios-security-code]').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'You need to select an option')
      })

      cy.title().should('eq', 'Choose how to get security codes - GOV.UK Pay')

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
      cy.get('#phone').type(validPhoneNumber, { delay: 0 })
      cy.get('button').contains('Continue').click()

      // should show page to enter code
      cy.title().should('eq', 'Check your phone - GOV.UK Pay')
      cy.get('.govuk-inset-text').should('contain', 'We have sent a code to ••••••••••0192.')

      // click link to go to the page to resend code
      cy.get('details').contains('Problems with the code?').click()
      cy.get('a').contains('send the code again').click()

      // should display page with phone number pre-filled
      cy.title().should('eq', 'Check your mobile phone number - GOV.UK Pay')
      cy.get('#phone').should('have.value', validPhoneNumber)

      // enter an invalid phone number and click resent
      cy.get('#phone').clear().type('a')
      cy.get('button').contains('Resend').click()

      // check that error message is displayed
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
        cy.get('[data-cy=error-summary-list-item]').eq(0)
          .contains('Enter a telephone number')
          .should('have.attr', 'href', '#phone')
      })
      cy.get('#phone').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter a telephone number')
      })
      cy.title().should('eq', 'Check your mobile phone number - GOV.UK Pay')
      cy.get('#phone').should('have.value', 'a')

      // enter a valid phone number and click continue
      cy.get('#phone').clear().type(validPhoneNumber)
      cy.get('button').contains('Resend').click()

      // check we're back on the page to enter the security code
      cy.title().should('eq', 'Check your phone - GOV.UK Pay')

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

      cy.get('#code').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter your security code')
      })

      cy.title().should('eq', 'Check your phone - GOV.UK Pay')

      // enter a valid code and click continue
      cy.get('#code').type('123456')
      cy.get('button').contains('Continue').click()

      // should show the success page
      cy.title().should('eq', 'You’ve created your account - GOV.UK Pay')
      cy.get('a[role=button]').contains('Continue').click()

      // should redirect to my services page
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
        inviteStubs.reprovisionOtpSuccess({
          code: inviteCode,
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

      cy.get('#code').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter your security code')
      })

      cy.title().should('eq', 'Set up an authenticator app - GOV.UK Pay')

      // enter a valid code and click continue
      cy.get('#code').type('123456')
      cy.get('button').contains('Continue').click()

      // should show the success page
      cy.title().should('eq', 'You’ve created your account - GOV.UK Pay')
      cy.get('a[role=button]').contains('Continue').click()

      // should redirect to my services page
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })

  describe('The success page is visited when the registration cookie is not present', () => {
    describe('There is a logged in user', () => {
      it('should redirect to the my services page', () => {
        const userExternalId = 'a-user-id'
        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, gatewayAccountId: '1' }),
          gatewayAccountStubs.getGatewayAccountsSuccess({
            gatewayAccountId: '1'
          })
        ])
        cy.setEncryptedCookies(userExternalId)

        cy.visit('/register/success')
        cy.title().should('eq', 'Choose service - GOV.UK Pay')
      })
    })

    describe('There is no logged in user', () => {
      it('should redirect to the login page', () => {
        cy.visit('/register/success')
        cy.title().should('eq', 'Sign in to GOV.UK Pay')
      })
    })
  })
})
