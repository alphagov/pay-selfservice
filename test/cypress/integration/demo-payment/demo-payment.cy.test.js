const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'

describe('Make a demo payment', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ gatewayAccountId, userExternalId }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId })
    ])
  })

  it('should load the demo payment details page', () => {
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
    cy.get('a').contains('Make a demo payment').click()
    cy.get('h1').should('have.text', 'Make a demo payment')
  })

  it('should have a default description and amount', () => {
    cy.get('#payment-description').contains('An example payment description')
    cy.get('#payment-amount').contains('£20.00')
  })

  it('should show the edit description page', () => {
    cy.get('#payment-description').find('a').contains('Edit').click()
    cy.get('h1').should('have.text', 'Edit payment description')
    cy.get('textarea').should('have.value', 'An example payment description')
  })

  it('should show error when description is empty', () => {
    cy.get('textarea').clear()
    cy.get('button').contains('Save changes').click()
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('h2').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary__list').should('have.length', 1)
      cy.get('.govuk-error-summary__list').first()
        .contains('Enter a payment description')
        .should('have.attr', 'href', '#payment-description')
    })
    cy.get('textarea').should('have.value', '')
  })

  it('should submit with a valid description', () => {
    cy.get('textarea').type('New description')
    cy.get('button').contains('Save changes').click()
    cy.get('h1').should('have.text', 'Make a demo payment')
    cy.get('#payment-description').contains('New description')
    cy.get('#payment-amount').contains('£20.00')
  })

  it('should show the edit amount page', () => {
    cy.get('#payment-amount').find('a').contains('Edit').click()
    cy.get('h1').should('have.text', 'Edit payment amount')
    cy.get('#payment-amount').should('have.value', '20.00')
  })

  it('should show error when the amount is invalid', () => {
    cy.get('#payment-amount').type('a')
    cy.get('button').contains('Save changes').click()
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('h2').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary__list').should('have.length', 1)
      cy.get('.govuk-error-summary__list').first()
        .contains('Enter an amount in pounds and pence')
        .should('have.attr', 'href', '#payment-amount')
    })
    cy.get('#payment-amount').should('have.value', '20.00')
  })

  it('should submit with a valid amount', () => {
    cy.get('#payment-amount').clear().type('1.00')
    cy.get('button').contains('Save changes').click()
    cy.get('h1').should('have.text', 'Make a demo payment')
    cy.get('#payment-description').contains('New description')
    cy.get('#payment-amount').contains('£1.00')
  })
})
