'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const userExternalId = 'userExternalId'
const accountNumber = '00012345'
const sortCode = '108800'
const bankDetailsUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/bank-details`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

function setupStubs (bankAccount, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(bankAccount)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      bankAccount: bankAccount
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, bankAccount })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId
  }]

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type, paymentProvider, gatewayAccountCredentials }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: bank details page', () => {
  describe('Card gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    describe('Bank details page is shown', () => {
      beforeEach(() => {
        setupStubs(false)
        cy.visit(bankDetailsUrl)
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'Enter your organisation’s banking details')

        cy.get('#bank-details-form').should('exist')
          .within(() => {
            cy.get('input#account-number').should('exist')
            cy.get('input#sort-code').should('exist')
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should have a back link that redirects back to tasklist page', () => {
        cy.get('.govuk-back-link').should('contain', 'Back to information for Stripe')
        cy.get('.govuk-back-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
      })

      it('should display an error when all fields are blank', () => {
        cy.get('#bank-details-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter a sort code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#sort-code')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('contain', 'Enter an account number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('have.attr', 'href', '#account-number')

        cy.get('input#account-number').should('have.class', 'govuk-input--error')
        cy.get('.govuk-form-group--error > input#account-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter an account number')
        })

        cy.get('input#sort-code').should('have.class', 'govuk-input--error')
        cy.get('.govuk-form-group--error > input#sort-code').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a sort code')
        })
      })
    })

    describe('Bank account flag already true', () => {
      it('should display an error when on Bank details page', () => {
        setupStubs(true)

        cy.visit(bankDetailsUrl)

        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#back-link').should('contain', 'Back to dashboard')
        cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
        cy.get('#error-message').should('contain', 'You’ve already provided your bank details. Contact GOV.UK Pay support if you need to update them.')
      })

      it('should display an error when submitting Bank details page', () => {
        setupStubs([false, true], 'live', 'stripe')

        cy.visit(bankDetailsUrl)

        cy.get('input#account-number[name="account-number"]').type(accountNumber)
        cy.get('input#sort-code[name="sort-code"]').type(sortCode)
        cy.get('#bank-details-form > button').click()

        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#back-link').should('contain', 'Back to dashboard')
        cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
        cy.get('#error-message').should('contain', 'You’ve already provided your bank details. Contact GOV.UK Pay support if you need to update them.')
      })
    })

    describe('Not a Stripe gateway account', () => {
      it('should show a 404 error when gateway account is not Stripe', () => {
        setupStubs(true, 'live', 'sandbox')

        cy.visit(bankDetailsUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('Not a live gateway account', () => {
      it('should show a 404 error when gateway account is not live', () => {
        setupStubs(false, 'test', 'sandbox')

        cy.visit(bankDetailsUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('User does not have the correct permissions', () => {
      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe' }),
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, bankAccount: false })
        ])

        cy.visit(bankDetailsUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })
})
