'use strict'
const userStubs = require('../../stubs/user-stubs')

const userExternalId = 'a-user-id'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-account-id'

describe('Privacy page', () => {
  describe('Logged out user', () => {
    it('should show the privacy page correctly', () => {
      cy.visit('/privacy')

      cy.get('h1').should('contain', 'Privacy notice')

      cy.get('[data-cy=sub-navigation]').should('exist')
      cy.get('[data-cy=sub-navigation] li').should('have.length', 10)

      cy.get('main h2').should('have.length', 10)

      cy.get('[data-cy=breadcrumbs]').should('not.exist')
    })
  })

  describe('Logged in user', () => {
    it('should show the privacy page correctly', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, gatewayAccountExternalId })
      ])

      cy.setEncryptedCookies(userExternalId)

      cy.visit('/privacy')

      cy.get('#navigation').should('contain', 'Sign out')
      cy.get('[data-cy=breadcrumbs]').should('exist')
    })
  })
})
