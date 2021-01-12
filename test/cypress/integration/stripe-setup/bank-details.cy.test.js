'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

function setupStubs (userExternalId, gatewayAccountId, bankAccount, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(bankAccount)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      bankAccount: bankAccount
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, bankAccount })
  }

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type, paymentProvider }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: bank details page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'
  const accountNumber = '00012345'
  const sortCode = '108800'

  describe('Card gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
    })

    describe('Bank details page is shown', () => {
      beforeEach(() => {
        setupStubs(userExternalId, gatewayAccountId, false)
        cy.visit('/bank-details')
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'What are your bank details?')

        cy.get('#bank-details-form').should('exist')
          .within(() => {
            cy.get('input#account-number').should('exist')
            cy.get('input#sort-code').should('exist')
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should display an error when all fields are blank', () => {
        cy.get('#bank-details-form > button').click()

        cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#sort-code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('contain', 'Account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('have.attr', 'href', '#account-number')

        cy.get('input#account-number').should('have.class', 'govuk-input--error')
        cy.get('label[for=account-number] > span').should('contain', 'This field cannot be blank')

        cy.get('input#sort-code').should('have.class', 'govuk-input--error')
        cy.get('label[for=sort-code] > span').should('contain', 'This field cannot be blank')
      })
    })

    describe('Bank account flag already true', () => {
      it('should redirect to Dashboard with an error message when on Bank details page', () => {
        setupStubs(userExternalId, gatewayAccountId, true)

        cy.visit('/bank-details')

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })

      it('should redirect to Dashboard with an error message when submitting Bank details page', () => {
        setupStubs(userExternalId, gatewayAccountId, [false, true], 'live', 'stripe')

        cy.visit('/bank-details')

        cy.get('input#account-number[name="account-number"]').type(accountNumber)
        cy.get('input#sort-code[name="sort-code"]').type(sortCode)
        cy.get('#bank-details-form > button').click()

        cy.get('h1').should('contain', 'Dashboard')
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/`)
        })
        cy.get('.flash-container > .generic-error').should('contain', 'You’ve already provided your bank details.')
        cy.get('.flash-container > .generic-error').should('contain', 'Contact GOV.UK Pay support if you need to update them.')
      })
    })

    describe('Not a Stripe gateway account', () => {
      it('should show a 404 error when gateway account is not Stripe', () => {
        setupStubs(userExternalId, gatewayAccountId, true, 'live', 'sandbox')

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('Not a live gateway account', () => {
      it('should show a 404 error when gateway account is not live', () => {
        setupStubs(userExternalId, gatewayAccountId, false, 'test', 'sandbox')

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('User does not have the correct permissions', () => {
      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' })
        ])

        cy.visit('/bank-details', {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'An error occurred:')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })
})
