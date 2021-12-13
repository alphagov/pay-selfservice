const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const emailOfRegisteringUser = 'test@test.test';

function setupStubs () {

}

describe('Set password when responding to invitation', () => {

  beforeEach(() => {
    cy.setEncryptedCookies(null)
    cy.setEncryptedRegisterInviteCookies({
        email: emailOfRegisteringUser,
        code: '12345'
    })
    setupStubs()
    cy.visit('/register')
  })

  it('should show the set password page', () => {
      cy.get('#email-display').should('contain', emailOfRegisteringUser)

      cy.get('#set-password-form').should('exist')
        .within(() => {
          cy.get('input[name="telephone-number"][type="tel"][autocomplete="tel"]').should('exist')
          cy.get('input[name="password"][type="password"][autocomplete="new-password"]').should('exist')
          cy.get('button#continue').should('exist')
        })
  })

  it('should show the form with error messages when input is invalid', () => {
      const invalidPhoneNumber = '12345'

      cy.get('input[name="telephone-number"]').type(invalidPhoneNumber)
      cy.get('input[name="password"]').type('toosimple')
      cy.get('button#continue').click()

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a')
          .contains('Invalid telephone number')
          .should('have.attr', 'href', '#telephone-number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a')
          .contains('Password must be 10 characters or more')
          .should('have.attr', 'href', '#password')
      })

      cy.get('#telephone-number-error').should('contain', 'Invalid telephone number')
      cy.get('input[name="telephone-number"]')
        .should('have.class', 'govuk-input--error')
        .should('have.attr', 'value', invalidPhoneNumber)

      cy.get('#password-error').should('contain', 'Password must be 10 characters or more')
      cy.get('input[name="password"]')
        .should('have.class', 'govuk-input--error')
        .should('not.have.attr', 'value')
  })

  it('should submit the form', () => {
    cy.get('input[name="telephone-number"]').type('03069 990000')
    cy.get('input[name="password"]').type('Long & compleX p@@sw0rd!')
    cy.get('button#continue').click()
  })
})
