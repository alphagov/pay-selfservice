'use strict'

const commonStubs = require('../../../utils/common_stubs')
const {
  stubGetGatewayAccountStripeSetupSuccess,
  stubStripeAccountGet
} = require('./support')

describe('Stripe setup: "VAT number / company number" index page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'
  describe('when user is admin, account is Stripe and "VAT number / company number" is not already submitted', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
        commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
        stubGetGatewayAccountStripeSetupSuccess(gatewayAccountId, false),
        stubStripeAccountGet(gatewayAccountId, 'acct_123example123')
      ])
      cy.setEncryptedCookies(userExternalId, gatewayAccountId, {})
    })

    it('should allow the user to complete the journey', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.get('#company-number-form').within(() => {
        cy.get('#company-number-declaration').check()
        cy.get('#company-number').type('01234567')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
      })
    })

    it('should allow the user to go back from company number to VAT number', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.visit('/vat-number-company-number/vat-number')

      cy.get('#vat-number-form').should('exist')
      cy.get('#vat-number').should('have.attr', 'value', 'GBGD001')
    })

    it('should allow the user to go back from check answers to VAT number', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.get('#company-number-form').within(() => {
        cy.get('#company-number-declaration').check()
        cy.get('#company-number').type('01234567')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
      })

      cy.visit('/vat-number-company-number/vat-number')

      cy.get('#vat-number-form').should('exist')
      cy.get('#vat-number').should('have.attr', 'value', 'GBGD001')
    })

    it('should allow the user to go back from check answers to company number (with number)', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.get('#company-number-form').within(() => {
        cy.get('#company-number-declaration').check()
        cy.get('#company-number').type('01234567')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
      })

      cy.visit('/vat-number-company-number/company-number')

      cy.get('#company-number-form').should('exist')
      cy.get('#company-number-declaration').should('have.attr', 'checked')
      cy.get('#company-number').should('be.visible')
      cy.get('#company-number').should('have.attr', 'value', '01234567')
    })

    it('should allow the user to go back from check answers to company number (without number)', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.get('#company-number-form').within(() => {
        cy.get('#company-number-declaration-2').check()
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
      })

      cy.visit('/vat-number-company-number/company-number')

      cy.get('#company-number-form').should('exist')
      cy.get('#company-number-declaration-2').should('have.attr', 'checked')
      cy.get('#company-number').should('not.be.visible')
      cy.get('#company-number').should('not.have.attr', 'value')
    })

    it('should redirect user from company number to VAT number if VAT number not already entered', () => {
      cy.visit('/vat-number-company-number/company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })
    })

    it('should redirect user from check answers to VAT number if VAT number not already entered', () => {
      cy.visit('/vat-number-company-number/check-your-answers')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').should('exist')
    })

    it('should redirect user from check answers to VAT number if VAT number not already entered', () => {
      cy.visit('/vat-number-company-number/check-your-answers')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').should('exist')
    })

    it('should redirect user from check answers to company number if company number not already entered', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.visit('/vat-number-company-number/check-your-answers')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.get('#company-number-form').should('exist')
    })

    it('should redirect user immediately back to check your answers if changed VAT number', () => {
      cy.visit('/vat-number-company-number')

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').type('GBGD001')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/company-number')
      })

      cy.get('#company-number-form').within(() => {
        cy.get('#company-number-declaration').check()
        cy.get('#company-number').type('01234567')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
      })

      cy.get('dl.govuk-summary-list > div.govuk-summary-list__row:nth-child(1) > dd.govuk-summary-list__actions > a').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/vat-number')
      })

      cy.get('#vat-number-form').within(() => {
        cy.get('#vat-number').clear().type('GBGD002')
        cy.get('button').click()
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/vat-number-company-number/check-your-answers')
      })
    })
  })
})
