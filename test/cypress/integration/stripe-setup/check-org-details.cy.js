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
const checkOrgDetailsUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/check-organisation-details`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

const validName = 'HMRC'
const validLine1 = 'A building'
const validLine2 = 'A street'
const validCity = 'A city'
const countryGb = 'GB'
const validPostcodeGb = 'E1 8QS'

function setupStubs (organisationDetails, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(organisationDetails)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      organisationDetails: organisationDetails
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId,
      organisationDetails
    })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId
  }]

  const merchantDetails = {
    name: validName,
    address_line1: validLine1,
    address_line2: validLine2,
    address_city: validCity,
    address_country: countryGb,
    address_postcode: validPostcodeGb
  }

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, merchantDetails }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId: gatewayAccountExternalId,
      type,
      paymentProvider,
      gatewayAccountCredentials
    }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: Check your organisation’s details', () => {
  describe('when user is admin, account is Stripe and "organisation details" is not already submitted', () => {
    beforeEach(() => {
      setupStubs(false)

      cy.setEncryptedCookies(userExternalId, {})

      cy.visit(checkOrgDetailsUrl)
    })

    it('should display page correctly', () => {
      cy.get('h1').should('contain', 'Check your organisation’s details')

      cy.get('#navigation-menu-your-psp')
        .should('contain', 'Information for Stripe')
        .parent().should('have.class', 'govuk-!-font-weight-bold')

      cy.get('[data-cy=org-details]').should('exist')
      cy.get('[data-cy=org-details]').find('dd').eq(0).should('contain', 'HMRC')
      cy.get('[data-cy=org-details]').find('dd').eq(1)
        .should('contain', validLine1)
        .should('contain', validLine2)
        .should('contain', validCity)
        .should('contain', validPostcodeGb)

      cy.get(`[data-cy=form]`)
        .within(() => {
          cy.get('[data-cy=yes-radio]').should('exist')
          cy.get('[data-cy=no-radio]').should('exist')
        })
    })

    it('should have a back link that redirects back to tasklist page', () => {
      cy.get('.govuk-back-link').should('contain', 'Back to information for Stripe')
      cy.get('.govuk-back-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
    })

    it('should display the account sub nav', () => {
      cy.get('[data-cy=account-sub-nav]')
        .should('exist')
    })

    it('should display an error when a radio button is not clicked', () => {
      cy.get('[data-cy=continue-button]').click()

      cy.get('[data-cy=error-summary] a')
        .should('contain', 'Select yes if your organisation’s details match the details on your government entity document')
        .should('have.attr', 'href', '#confirm-org-details')

      cy.get('[data-cy=error-message]').should('contain', 'Select yes if your organisation’s details match the details on your government entity document')

      cy.get('#navigation-menu-your-psp')
        .should('contain', 'Information for Stripe')
        .parent().should('have.class', 'govuk-!-font-weight-bold')

      cy.get('.govuk-back-link')
        .should('contain', 'Back to information for Stripe')
        .should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
    })
  })

  describe('when user is admin, account is Stripe and "organisation details" is already submitted', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should display an error when displaying the page', () => {
      setupStubs(true)

      cy.visit(checkOrgDetailsUrl)

      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#back-link').should('contain', 'Back to dashboard')
      cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
      cy.get('#error-message').should('contain', 'You’ve already submitted your organisation details. Contact GOV.UK Pay support if you need to update them.')
    })
  })

  describe('when it is not a Stripe gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should show a 404 error when gateway account is not Stripe', () => {
      setupStubs(false, 'live', 'sandbox')

      cy.visit(checkOrgDetailsUrl, {
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

      cy.visit(checkOrgDetailsUrl, {
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
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
          gatewayAccountId,
          gatewayAccountExternalId: gatewayAccountExternalId,
          type: 'live',
          paymentProvider: 'stripe'
        }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, vatNumber: true })
      ])

      cy.visit(checkOrgDetailsUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })
})
