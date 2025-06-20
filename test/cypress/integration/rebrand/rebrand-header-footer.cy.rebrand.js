'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'

describe('New branding', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)

    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
    ])
  })

  it('should display the header and footer with the new brand', () => {
    cy.visit('/')

    cy.log('Should display the header with new branding')

    cy.get('[data-cy=header]').should('have.css', 'background-color', 'rgb(29, 112, 184)')
    cy.get('[data-cy=header]').should('have.css', 'color', 'rgb(255, 255, 255)')
    cy.get('[data-cy=header]')
      .find('.govuk-header__container')
      .should('have.css', 'border-bottom-color', 'rgb(255, 255, 255)')

    cy.log('Should display the footer with new branding')

    cy.get('[data-cy=footer]')
      .should('have.css', 'background-color', 'rgb(244, 248, 251)')
      .should('have.css', 'border-top-color', 'rgb(29, 112, 184)')
  })
})
