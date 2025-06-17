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
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
    ])
  })

  it('should redirect to the My services page', () => {
    cy.visit('/')
    cy.get('h1').should('have.text', 'My services')
    cy.location().should((location) => {
      expect(location.pathname).to.eq('/my-services')
    })
  })

  describe('footer content when logged in', () => {
    beforeEach(() => {
      cy.visit('/')
    })

    it('should display the About section with 6 links', () => {
      cy.get('footer .govuk-footer__section')
        .contains('About')
        .parent()
        .find('a')
        .should('have.length', 6)
    })

    it('should display the Support section with 4 links', () => {
      cy.get('footer .govuk-footer__section')
        .contains('Support')
        .parent()
        .find('a')
        .should('have.length', 4)
    })

    it('should display the Legal Terms section with 5 links when logged in', () => {
      cy.get('footer .govuk-footer__section')
        .contains('Legal Terms')
        .parent()
        .find('a')
        .should('have.length', 4)
    })
  })
})
