'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const gatewayAccountId = 42
const userExternalId = 'userExternalId'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const companyNumberUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/company-number`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

function setupStubs (companyNumber, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(companyNumber)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      companyNumber: companyNumber
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, companyNumber })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId
  }]

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId: gatewayAccountExternalId, type, paymentProvider, gatewayAccountCredentials }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: company number page', () => {
  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "company number" is not already submitted', () => {
      beforeEach(() => {
        setupStubs(false)

        cy.setEncryptedCookies(userExternalId, {})
        cy.visit(companyNumberUrl)
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'Company registration number')

        cy.get('#navigation-menu-your-psp')
          .should('contain', 'Information for Stripe')
          .parent().should('have.class', 'govuk-!-font-weight-bold')

        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('be.visible')

            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')
          })
      })

      it('should have a back link that redirects back to tasklist page', () => {
        cy.get('.govuk-back-link').should('contain', 'Back to information for Stripe')
        cy.get('.govuk-back-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
      })

      it('should display an error when no options are selected', () => {
        cy.get('#company-number-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'You must answer this question')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number-declaration')

        cy.get('#company-number-declaration-error').should('contain', 'You must answer this question')

        cy.get('#navigation-menu-your-psp')
          .should('contain', 'Information for Stripe')
          .parent().should('have.class', 'govuk-!-font-weight-bold')

        cy.get('.govuk-back-link')
          .should('contain', 'Back to information for Stripe')
          .should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
      })

      it('should display an error when company number input is blank and "Yes" option is selected', () => {
        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').type('        ')

            cy.get('button').click()
          })

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter a Company registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#company-number')

        cy.get('input#company-number[name="company-number"]').should('have.class', 'govuk-input--error')
        cy.get('#company-number-error').should('contain', 'Enter a Company registration number')
      })
    })

    describe('when user is admin, account is Stripe and "company number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should display an error when displaying the page', () => {
        setupStubs(true)

        cy.visit(companyNumberUrl)

        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#back-link').should('contain', 'Back to dashboard')
        cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
        cy.get('#error-message').should('contain', 'You’ve already provided your Company registration number. Contact GOV.UK Pay support if you need to update it.')
      })

      it('should display an error when submitting the form', () => {
        setupStubs([false, true])

        cy.visit(companyNumberUrl)

        cy.get('#company-number-form').should('exist')
          .within(() => {
            cy.get('input#company-number-declaration-2[name="company-number-declaration"]').check()
            cy.get('input#company-number[name="company-number"]').should('not.be.visible')

            cy.get('button').click()
          })

        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#back-link').should('contain', 'Back to dashboard')
        cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
        cy.get('#error-message').should('contain', 'You’ve already provided your Company registration number. Contact GOV.UK Pay support if you need to update it.')
      })
    })

    describe('when it is not a Stripe gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a 404 error when gateway account is not Stripe', () => {
        setupStubs([false, true], 'live', 'sandbox')

        cy.visit(companyNumberUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when it is not a live gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a 404 error when gateway account is not live', () => {
        setupStubs([false, true], 'test', 'stripe')

        cy.visit(companyNumberUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'Page not found')
      })
    })

    describe('when the user does not have the correct permissions', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId: gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe' }),
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, companyNumber: true })
        ])

        cy.visit(companyNumberUrl, { failOnStatusCode: false })
        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })
})
