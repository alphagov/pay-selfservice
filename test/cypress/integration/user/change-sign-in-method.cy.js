const userStubs = require('../../stubs/user-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const provisionalOtpKey = 'GJMD42XJZRUXEDFWWBDJGQ4PACPXZ6EF'
const validPhoneNumber = '+441234567890'

describe('Change sign in method', () => {
  describe('Current method is APP', () => {
    describe('Change method to SMS', () => {
      describe('User does not have a phone number set', () => {
        it('should ask for a phone number and complete change sign-in method', () => {
          cy.setEncryptedCookies(userExternalId)

          cy.task('setupStubs', [
            userStubs.getUserSuccess({ userExternalId, telephoneNumber: null, secondFactor: 'APP', provisionalOtpKey }),
            userStubs.postProvisionSecondFactorSuccess(userExternalId)
          ])

          cy.visit('/my-profile/two-factor-auth')
          cy.percySnapshot()

          // check page is correct for when current method is APP
          cy.get('p.govuk-body').contains('You currently use an authenticator app').should('exist')
          cy.get('.govuk-radios').should('exist')
          cy.get('button').contains('Submit').should('exist')
          cy.get('button').contains('Use an authenticator app instead').should('not.exist')

          // select option to use SMS as sign-in method
          cy.get('input[type="radio"][value="SMS"]').click()
          cy.get('button').contains('Submit').click()

          cy.title().should('equal', 'Enter your mobile phone number - GOV.UK Pay')
          cy.get('h1').should('contain', 'Enter your mobile phone number')

          // submit the page with an invalid a phone number
          cy.get('input#phone').type('0')
          cy.get('button').contains('Continue').click()

          // check that an error message is displayed
          cy.get('.govuk-error-summary').should('exist').within(() => {
            cy.get('h2').should('contain', 'There is a problem')
            cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
            cy.get('[data-cy=error-summary-list-item]').first()
              .contains('Enter a telephone number')
              .should('have.attr', 'href', '#phone')
          })
          cy.title().should('equal', 'Enter your mobile phone number - GOV.UK Pay')

          cy.get('.govuk-form-group--error > input#phone').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'Enter a telephone number')
          })

          // check that invalid phone number is pre-filled
          cy.get('input#phone').should('have.value', '0')
          cy.get('input#phone').clear()

          // enter a valid phone number and submit
          cy.get('input#phone').type(validPhoneNumber, { delay: 0 })

          // re-configure stubs so the user returned from adminusers has a phone number set for future requests
          cy.task('clearStubs')
          cy.task('setupStubs', [
            userStubs.getUserSuccess({
              userExternalId,
              telephoneNumber: validPhoneNumber,
              secondFactor: 'APP',
              provisionalOtpKey
            }),
            userStubs.postProvisionSecondFactorSuccess(userExternalId),
            userStubs.patchUpdateUserPhoneNumberSuccess(userExternalId, validPhoneNumber),
            userStubs.postSecondFactorSuccess(userExternalId),
            userStubs.postActivateSecondFactorSuccess(userExternalId)
          ])

          cy.get('button').contains('Continue').click()

          // check we're on the page to enter a security code
          cy.title().should('equal', 'Check your phone - GOV.UK Pay')
          cy.get('h1').should('contain', 'Check your phone')

          // click the link to try sending the code again
          cy.get('[data-cy=resend-code-link]').should('exist').click()

          // check we're on the page to resend the security code
          cy.title().should('equal', 'Resend security code - GOV.UK Pay')
          cy.get('h1').should('contain', 'Check your mobile number')

          // check the existing phone number for the user is pre-filled
          cy.get('input#phone').should('have.value', validPhoneNumber)

          // check an error message is displayed when an invalid phone number is entered
          cy.get('input#phone').type('000')
          cy.get('button').contains('Resend security code').click()

          // check that an error message is displayed
          cy.get('.govuk-error-summary').should('exist').within(() => {
            cy.get('h2').should('contain', 'There is a problem')
            cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
            cy.get('[data-cy=error-summary-list-item]').first()
              .contains('Enter a telephone number')
              .should('have.attr', 'href', '#phone')
          })
          cy.title().should('equal', 'Resend security code - GOV.UK Pay')

          cy.get('.govuk-form-group--error > input#phone').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'Enter a telephone number')
          })

          // check the submitted phone number is displayed back
          cy.get('input#phone').should('have.value', validPhoneNumber + '000')

          // enter a valid telephone number and click resend
          cy.get('input#phone').clear()
          cy.get('input#phone').type(validPhoneNumber, { delay: 0 })
          cy.get('button').contains('Resend security code').click()

          // check we are sent back to the page to enter the security code with a notification message
          cy.title().should('equal', 'Check your phone - GOV.UK Pay')
          cy.get('.govuk-notification-banner--success').should('exist').should('contain', 'Another security code has been sent to your phone')

          // submit the page wihout entering a code
          cy.get('button').contains('Complete').click()

          // check that an error is displayed
          cy.get('.govuk-error-summary').should('exist').within(() => {
            cy.get('h2').should('contain', 'There is a problem')
            cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
            cy.get('[data-cy=error-summary-list-item]').first()
              .contains('Enter your security code')
              .should('have.attr', 'href', '#code')
          })
          cy.title().should('equal', 'Check your phone - GOV.UK Pay')

          cy.get('.govuk-form-group--error > input#code').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'Enter your security code')
          })

          // enter a valid code and submit
          cy.get('input#code').type('123456', { delay: 0 })
          cy.get('button').contains('Complete').click()

          // check we're redirected to the "My profile" page with a success message
          cy.title().should('equal', 'My profile - GOV.UK Pay')
          cy.get('.govuk-notification-banner--success').should('exist')
          cy.get('.govuk-notification-banner--success > .govuk-notification-banner__content > p.govuk-notification-banner__heading').should('contain', 'Your sign-in method has been updated')
          cy.get('.govuk-notification-banner--success > .govuk-notification-banner__content > p.govuk-body').should('contain', 'We’ll send you a text message when you next sign in.')
        })
      })
    })

    describe('Use a different authenticator app', () => {
      it('should show page to set up app', () => {
        cy.setEncryptedCookies(userExternalId)

        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, telephoneNumber: null, secondFactor: 'APP', provisionalOtpKey }),
          userStubs.postProvisionSecondFactorSuccess(userExternalId)
        ])

        cy.visit('/my-profile/two-factor-auth')
        cy.percySnapshot()

        // select option to use APP as sign-in method
        cy.get('input[type="radio"][value="APP"]').click()
        cy.get('button').contains('Submit').click()

        // check we're sent to a page for setting up the authenticator app
        cy.title().should('equal', 'Set up an authenticator app - GOV.UK Pay')
        cy.get('h1').should('contain', 'Set up an authenticator app')
      })
    })
  })

  describe('Current method is SMS', () => {
    describe('Change method to APP', () => {
      it('should show page to set up app', () => {
        cy.setEncryptedCookies(userExternalId)

        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, telephoneNumber: null, secondFactor: 'SMS', provisionalOtpKey }),
          userStubs.postProvisionSecondFactorSuccess(userExternalId),
          userStubs.postActivateSecondFactorSuccess(userExternalId)
        ])

        cy.visit('/my-profile/two-factor-auth')
        cy.percySnapshot()

        // check page is correct for when current method is SMS
        cy.get('p.govuk-body').contains('You currently use text message codes').should('exist')
        cy.get('button').contains('Use an authenticator app instead').should('exist')
        cy.get('.govuk-radios').should('not.exist')
        cy.get('button').contains('Submit').should('not.exist')
        cy.get('[data-cy=resend-code-link]').should('not.exist')

        cy.get('button').contains('Use an authenticator app instead').click()

        // check we're sent to a page for setting up the authenticator app
        cy.title().should('equal', 'Set up an authenticator app - GOV.UK Pay')
        cy.get('h1').should('contain', 'Set up an authenticator app')
        cy.get('p.govuk-body').contains('Open your authenticator app on your smartphone').should('exist')

        // should contain code with spaces every 4 characters
        cy.get('[data-cy=otp-secret]').should('have.text', 'GJMD 42XJ ZRUX EDFW WBDJ GQ4P ACPX Z6EF')

        // enter the code
        cy.get('input#code').type('123456')
        cy.get('button').contains('Complete').click()

        // check we're redirected to the "My profile" page with a success message
        cy.title().should('equal', 'My profile - GOV.UK Pay')
        cy.get('.govuk-notification-banner--success').should('exist')
        cy.get('.govuk-notification-banner--success > .govuk-notification-banner__content > p.govuk-notification-banner__heading').should('contain', 'Your sign-in method has been updated')
        cy.get('.govuk-notification-banner--success > .govuk-notification-banner__content > p.govuk-body').should('contain', 'Use your authenticator app when you next sign in.')
      })
    })
  })
})
