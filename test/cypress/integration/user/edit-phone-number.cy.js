const userStubs = require('../../stubs/user-stubs')

describe('Edit phone number flow', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const testPhoneNumber = '+441234567890'
  const testPhoneNumberNew = '+441987654321'

  it('should allow a user to change their phone number', () => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, telephoneNumber: testPhoneNumber }),
      userStubs.patchUpdateUserPhoneNumberSuccess(userExternalId, testPhoneNumberNew)
    ])

    cy.visit('/my-profile')
    cy.get('#telephone-number').should('contain', testPhoneNumber)
    cy.get('#change-phone-link').should('exist').click()

    cy.get('input[name="phone"]').should('exist')
    cy.get('input[name="phone"]').should('have.attr', 'value', testPhoneNumber)

    cy.log('Check an error is displayed when an invalid number is entered')
    cy.visit('/my-profile/phone-number')
    cy.get('input[name="phone"]').clear().type('not a number')
    cy.get('#save-phone-number').click()
    cy.get('.govuk-error-summary').should('exist')
    cy.get('input[name="phone"]').should('have.class', 'govuk-input--error')

    cy.log('Enter a valid phone number and submit')
    cy.visit('/my-profile/phone-number')
    cy.get('input[name="phone"]').clear().type(testPhoneNumberNew)
    cy.get('#save-phone-number').click()
    cy.get('.govuk-notification-banner--success').should('exist').should('contain', 'Phone number updated')
  })
})
