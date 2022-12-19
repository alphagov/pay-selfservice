'use strict'

describe('Privacy page', () => {
  it('should show the privacy', () => {
    cy.visit('/privacy')

    cy.get('h1').should('contain', 'Privacy notice')
  })
})
