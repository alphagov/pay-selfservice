'use strict'

const commonStubs = require('../../utils/common_stubs')

describe('Stripe setup: bank details page', () => {
  const userExternalId = 'userExternalId'

  describe('Card gateway account', () => {
    const gatewayAccountId = 42

    const getStripeSetupStub = function getStripeSetupStub (bankAccountCompleted) {
      const stripeSetupStub = {
        name: 'getGatewayAccountStripeSetupSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          bank_account: bankAccountCompleted
        }
      }
      return stripeSetupStub
    }

    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    })

    describe('Bank details page is shown', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeSetupStub(false)
        ])

        cy.visit('/bank-details')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'Add bank details')

        cy.get('form#stripe-setup-bank-details-form').should('exist')
        cy.get('input#stripe-setup-account-number-input').should('exist')
        cy.get('input#stripe-setup-sort-code-input').should('exist')
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').should('exist')
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').should('contain', 'Continue')
      })

      it('should display an error when all fields are blank', () => {
        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#stripe-setup-account-number-input')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('have.attr', 'href', '#stripe-setup-sort-code-input')

        cy.get('input#stripe-setup-account-number-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-account-number-input] > span').should('contain', 'This field cannot be blank')

        cy.get('input#stripe-setup-sort-code-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-sort-code-input] > span').should('contain', 'This field cannot be blank')
      })

      it('should display an error when account number is invalid', () => {
        cy.get('#stripe-setup-account-number-input').type('abc')
        cy.get('#stripe-setup-sort-code-input').type('108800')

        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#stripe-setup-account-number-input')

        cy.get('input#stripe-setup-account-number-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-account-number-input] > span').should('contain', 'Please enter a valid account number')
      })

      it('should display an error when sort code is invalid', () => {
        cy.get('#stripe-setup-account-number-input').type('00012345')
        cy.get('#stripe-setup-sort-code-input').type('abc')

        cy.get('#stripe-setup-bank-details-form > button[type=submit]').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#stripe-setup-sort-code-input')

        cy.get('input#stripe-setup-sort-code-input').should('have.class', 'govuk-input--error')
        cy.get('label[for=stripe-setup-sort-code-input] > span').should('contain', 'Please enter a valid sort code')
      })
    })

    describe('Bank account flag already true', () => {
      it('should redirect to Dashboard with an error message', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe'),
          getStripeSetupStub(true)
        ])

        cy.visit('/bank-details')
        cy.get('h1').should('contain', 'Dashboard')

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })

        cy.get('.flash-container > .generic-error').should('contain', 'Bank details flag already set')
      })
    })

    describe('Not a Stripe gateway account', () => {
      it('should show a 404 error when gateway account is not Stripe', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'sandbox')
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('Not a live gateway account', () => {
      it('should show a 404 error when gateway account is not live', () => {
        cy.task('setupStubs', [
          commonStubs.getUserStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'test', 'stripe')
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('User does not have the correct permissions', () => {
      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          commonStubs.getUserWithNoPermissionsStub(userExternalId, [gatewayAccountId]),
          commonStubs.getGatewayAccountStub(gatewayAccountId, 'live', 'stripe')
        ])

        cy.visit('/bank-details')
        cy.get('h1').should('contain', 'An error occurred:')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })

  describe('Direct Debit gateway account', () => {
    const directDebitGatewayAccountId = 'DIRECT_DEBIT:101'

    it('should show an error page', () => {
      cy.setEncryptedCookies(userExternalId, directDebitGatewayAccountId)

      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [directDebitGatewayAccountId]),
        commonStubs.getDirectDebitGatewayAccountStub(directDebitGatewayAccountId, 'live', 'go-cardless')
      ])

      cy.visit('/bank-details', {
        failOnStatusCode: false
      })

      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'This page is only available to card accounts not direct debit accounts.')
    })
  })
})
