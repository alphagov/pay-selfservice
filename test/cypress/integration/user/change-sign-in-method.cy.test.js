const userStubs = require('../../stubs/user-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'

describe('Change sign in method', () => {
  describe('Change method to SMS', () => {
    describe('User does not have a phone number set', () => {
      it('should ask for a phone number and complete change sign-in method', () => {
        cy.setEncryptedCookies(userExternalId)

        cy.task('setupStubs', [
          userStubs.getUserSuccess({ userExternalId, telephoneNumber: null, secondFactor: 'APP' }),
          userStubs.postProvisionSecondFactorSuccess(userExternalId)
        ])

        cy.visit('/my-profile/two-factor-auth')
        cy.get('input[type="radio"][value="SMS"]').click()
        cy.get('button').contains('Submit').click()

        cy.title().should('equal', 'Enter your mobile phone number - GOV.UK Pay')
        cy.get('h1').should('contain', 'Enter your mobile phone number')

        // submit the page with an invalid a phone number
        cy.get('input#phone').type('0')
        cy.get('button').contains('Continue').click()
        cy.title().should('equal', 'Enter your mobile phone number - GOV.UK Pay')

        // check that an error message is displayed
        cy.get('.govuk-error-summary').should('exist').within(() => {
          cy.get('h2').should('contain', 'There is a problem')
          cy.get('.govuk-error-summary__list').should('have.length', 1)
          cy.get('.govuk-error-summary__list').first()
            .contains('Enter a telephone number')
            .should('have.attr', 'href', '#phone')
        })

        cy.get('.govuk-form-group--error > input#phone').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a telephone number')
        })

        // check that invalid phone number is pre-filled
        cy.get('input#phone').should('have.value', '0')
        cy.get('input#phone').clear()

        // enter a valid phone number and submit
        cy.get('input#phone').type('+441234567890', { delay: 0 })

        cy.get('button').contains('Continue').click()

        // check we're on the page to enter a verification code
        cy.title().should('equal', 'Check your phone - GOV.UK Pay')
        cy.get('h1').should('contain', 'Check your phone')

        // submit the page wihout entering a code
        cy.get('button').contains('Complete').click()

        // check that an error is displayed
        cy.get('.govuk-error-summary').should('exist').within(() => {
          cy.get('h2').should('contain', 'There is a problem')
          cy.get('.govuk-error-summary__list').should('have.length', 1)
          cy.get('.govuk-error-summary__list').first()
            .contains('Enter a verification code')
            .should('have.attr', 'href', '#code')
        })

        cy.get('.govuk-form-group--error > input#code').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a verification code')
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
})
