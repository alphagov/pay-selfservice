'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'

describe('The index page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)

    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId }),
    ])
  })

  it('should redirect to the My services page', () => {
    cy.visit('/')
    cy.get('h1').should('have.text', 'My services')
    cy.location().should((location) => {
      expect(location.pathname).to.eq('/my-services')
    })
  })

  describe('Header and footer', () => {
    it('should display the header and footer correctly when logged in', () => {
      cy.visit('/')

      cy.log('should display the GOV.UK header correctly')

      cy.percySnapshot()

      cy.get('[data-cy=header]').should('have.css', 'background-color', 'rgb(29, 112, 184)')
      cy.get('[data-cy=header]').should('have.css', 'color', 'rgb(255, 255, 255)')
      cy.get('[data-cy=header]')
        .find('.govuk-header__container')
        .should('have.css', 'border-bottom-color', 'rgb(255, 255, 255)')
      cy.get('[data-cy=header]').find('.govuk-header__product-name').should('contain', 'Pay')

      cy.log('should display the GOV.UK footer correctly')

      cy.get('[data-cy=footer]')
        .should('have.css', 'background-color', 'rgb(244, 248, 251)')
        .should('have.css', 'border-top-color', 'rgb(29, 112, 184)')

      cy.log('footer - should display the About section with 6 links')

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__section')
        .contains('About')
        .parent()
        .find('a')
        .should('have.length', 6)

      cy.log('footer - should display the Support section with 4 links')

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__section')
        .contains('Support')
        .parent()
        .find('a')
        .should('have.length', 4)

      cy.log('should display the Legal Terms section with 5 links when logged in')

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__section')
        .contains('Legal Terms')
        .parent()
        .find('a')
        .should('have.length', 4)
    })
  })
})
