'use strict'

describe('Cookie banner', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  describe('Visiting application for first time', () => {
    it('Should show cookie banner on page load', () => {
      cy.get('#pay-cookie-banner').should('have.css', 'display', 'block')
    })

    it('should show accepted message if consented is accepted', () => {
      cy.get('button[data-accept-cookies=true]').click()

      cy.get('.pay-cookie-banner__confirmation-message').contains('You’ve accepted analytics cookies')
      cy.get('.pay-cookie-banner__wrapper').should('have.css', 'display', 'none')
    })

    it('should show rejected message if consented is rejected', () => {
      cy.visit('/')
      cy.get('button[data-accept-cookies=false]').click()

      cy.get('.pay-cookie-banner__confirmation-message').contains('You told us not to use analytics cookies')
      cy.get('.pay-cookie-banner__wrapper').should('have.css', 'display', 'none')
    })
  })

  describe('For revisiting users', () => {
    it('Should not show cookie banner on page load if consent has been accepted previously', () => {
      cy.setCookie('govuk_pay_cookie_policy', '{"analytics":true}')
      cy.visit('/')

      cy.get('#pay-cookie-banner').should('have.css', 'display', 'none')
    })
    it('Should not show cookie banner on page load if consent has been rejected previously', () => {
      cy.setCookie('govuk_pay_cookie_policy', '{"analytics":false}')
      cy.visit('/')

      cy.get('#pay-cookie-banner').should('have.css', 'display', 'none')
    })
  })
})
