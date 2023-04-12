'use strict'

const userStubs = require('../../stubs/user-stubs')

const userExternalId = 'authenticated-user-id'

describe('Error pages', () => {
  describe('User not logged in', () => {
    beforeEach(() => {
      cy.clearCookies()
    })
    it('should display logged out header on 404 page', () => {
      cy.visit('/a-route-that-does-not-exist', { failOnStatusCode: false })
      cy.percySnapshot()
      cy.get('h1').should('have.text', 'Page not found')
      cy.get('nav').contains('Sign in')
      cy.get('.govuk-breadcrumbs').should('not.exist')
    })
  })

  describe('User logged in', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [userStubs.getUserSuccess({ userExternalId })])
    })

    it('should display logged in header on 404 page', () => {
      cy.visit('/a-route-that-does-not-exist', { failOnStatusCode: false })
      cy.percySnapshot()
      cy.get('h1').should('have.text', 'Page not found')
      cy.get('nav').contains('My profile')
      cy.get('.govuk-breadcrumbs').should('exist')
      cy.get('.govuk-breadcrumbs').find('.govuk-breadcrumbs__list-item').should('have.length', 1)
      cy.get('.govuk-breadcrumbs').find('.govuk-breadcrumbs__list-item').contains('My services')
    })

    it('should display logged in header on error page', () => {
      cy.visit('/account/no-access-to-account-id/dashboard', { failOnStatusCode: false })
      cy.percySnapshot()
      cy.get('h1').should('have.text', 'An error occurred')
      cy.get('nav').contains('My profile')
      cy.get('.govuk-breadcrumbs').should('exist')
      cy.get('.govuk-breadcrumbs').find('.govuk-breadcrumbs__list-item').should('have.length', 1)
      cy.get('.govuk-breadcrumbs').find('.govuk-breadcrumbs__list-item').contains('My services')
    })
  })
})
