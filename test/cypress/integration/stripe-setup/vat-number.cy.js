'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const gatewayAccountId = '42'
const userExternalId = 'userExternalId'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const vatNumberUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/vat-number`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`
const taskListUrl = `/account/${gatewayAccountExternalId}/your-psp/a-valid-credential-external-id`

function setupStubs (vatNumber, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(vatNumber)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      vatNumber
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, vatNumber })
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
    stripeAccountSetupStubs.patchUpdateStripeSetupSuccess(gatewayAccountId, { path: 'vat_number', value: true }),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: VAT number page', () => {
  describe('Card gateway account', () => {
    describe('when user is admin, account is Stripe and "VAT number" is not already submitted', () => {
      beforeEach(() => {
        setupStubs(false)

        cy.setEncryptedCookies(userExternalId, {})

        cy.visit(vatNumberUrl)
      })

      it('should display page correctly', () => {
        cy.get('h1').should('contain', 'VAT registration number')

        cy.get('#navigation-menu-your-psp')
          .should('contain', 'Information for Stripe')
          .parent().should('have.class', 'govuk-!-font-weight-bold')

        cy.get('#vat-number-form').should('exist')
          .within(() => {
            cy.get('input#have-vat-number').should('exist')
            cy.get('input#not-have-vat-number').should('exist')
            cy.get('input#vat-number[name="vat-number"]').should('exist')
            cy.get('button').should('exist')
            cy.get('button').should('contain', 'Save and continue')

            cy.get('#navigation-menu-switch-psp').should('not.exist')
          })
      })

      it('should have a back link that redirects back to tasklist page', () => {
        cy.get('.govuk-back-link').should('contain', 'Back to information for Stripe')
        cy.get('.govuk-back-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
      })

      it('should display an error when VAT number input is blank', () => {
        cy.get('input#have-vat-number').click()
        cy.get('#vat-number-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('input#have-vat-number').should('be.checked')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter your VAT registration number')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#vat-number')

        cy.get('.govuk-form-group--error > input#vat-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('p.govuk-error-message').should('contain', 'Enter your VAT registration number')
        })

        cy.get('#navigation-menu-your-psp')
          .should('contain', 'Information for Stripe')
          .parent().should('have.class', 'govuk-!-font-weight-bold')

        cy.get('.govuk-back-link')
          .should('contain', 'Back to information for Stripe')
          .should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
      })

      it('should redirect to tasklist page when "No" VAT number is chosen', () => {
        cy.get('input#not-have-vat-number').click()
        cy.get('#vat-number-form > button').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(taskListUrl)
        })
      })

      it('should display an error when no option was chosen', () => {
        cy.get('#vat-number-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'You must answer this question')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#have-vat-number')
      })
    })

    describe('when user is admin, account is Stripe and "VAT number" is already submitted', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should display an error when displaying the page', () => {
        setupStubs(true)

        cy.visit(vatNumberUrl)

        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#back-link').should('contain', 'Back to dashboard')
        cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
        cy.get('#error-message').should('contain', 'You’ve already provided your VAT number. Contact GOV.UK Pay support if you need to update it.')
      })

      it('should display an error when submitting the form', () => {
        setupStubs([false, true])

        cy.visit(vatNumberUrl)

        cy.get('input#have-vat-number').click()
        cy.get('input#vat-number[name="vat-number"]').type('GB999 9999 73')

        cy.get('#vat-number-form > button').click()

        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#back-link').should('contain', 'Back to dashboard')
        cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
        cy.get('#error-message').should('contain', 'You’ve already provided your VAT number. Contact GOV.UK Pay support if you need to update it.')
      })
    })

    describe('when it is not a Stripe gateway account', () => {
      beforeEach(() => {
        cy.setEncryptedCookies(userExternalId)
      })

      it('should show a 404 error when gateway account is not Stripe', () => {
        setupStubs(false, 'live', 'sandbox')

        cy.visit(vatNumberUrl, {
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
        setupStubs(false, 'test', 'stripe')

        cy.visit(vatNumberUrl, {
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
          gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe' }),
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, vatNumber: true })
        ])

        cy.visit(vatNumberUrl, { failOnStatusCode: false })
        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })
})
