'use strict'

describe('Privacy page', () => {
  it('should show the privacy page', () => {
    cy.visit('/privacy')

    cy.get('h1').should('contain', 'Privacy notice')

    cy.get('[data-cy=sub-navigation]').should('exist')
    cy.get('[data-cy=sub-navigation] li').should('have.length', 10)

    cy.get('main h2').should('have.length', 10)
  })
})
