const userStubs = require('../../stubs/user-stubs')

const authenticatedUserId = 'authenticated-user-id'
const serviceName = {
  en: 'System Generated'
}

describe('Set service name for account registration', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session')
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId: authenticatedUserId, serviceName })
    ])
  })

  it('should show page to update service name', () => {
    cy.setEncryptedCookies(authenticatedUserId)
    cy.visit('/service/set-name')
    cy.get('h1').should('contain', 'What service will you be taking payments for?')
    cy.get('input#service-name').should('exist')
  })

  it('should display a validation error and pre-fill service name if too long', () => {
    const serviceName = 'Lorem ipsum dolor sit amet, consectetuer adipiscing'
    cy.get('input#service-name').type(serviceName, { delay: 0 })
    cy.get('button').contains('Add service').click()

    cy.get('.govuk-error-summary').find('a').should('have.length', 1)
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('a[href="#service-name"]').should('contain', 'Service name must be 50 characters or fewer')
    })
    cy.get('.govuk-form-group--error > input#service-name').parent().should('exist').within(() => {
      cy.get('.govuk-error-message').should('contain', 'Service name must be 50 characters or fewer')
    })

    cy.get('input#service-name').should('have.value', serviceName)
  })
})