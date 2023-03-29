'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripePspStubs = require('../../stubs/stripe-psp-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceExternalId = 'a-service-external-id'

function getUserAndAccountStubs (paymentProvider, providerSwitchEnabled, gatewayAccountCredentials, merchantDetails) {
  return [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId, merchantDetails }),
    userStubs.getUserSuccess({ gatewayAccountId, userExternalId, serviceExternalId, merchantDetails }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      providerSwitchEnabled,
      paymentProvider,
      ...gatewayAccountCredentials && { gatewayAccountCredentials }
    })
  ]
}

describe('Switch PSP', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('Organisation URL', () => {
    const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
    const validUrl = 'https://www.valid-url.com'

    describe('User is an admin user', () => {
      beforeEach(() => {
        const stripeUpdateAccountStub = stripePspStubs.updateAccount({
          stripeAccountId: 'acct_123example123',
          url: validUrl
        })
        const merchantDetails = {
          url: validUrl
        }

        const servicePatch = serviceStubs.patchUpdateMerchantDetailsSuccess({
          serviceExternalId, gatewayAccountId, merchantDetails
        })

        cy.task('setupStubs', [
          ...getUserAndAccountStubs(
            'smartpay',
            true,
            [
              { payment_provider: 'smartpay', state: 'ACTIVE' },
              {
                external_id: gatewayAccountCredentialExternalId,
                payment_provider: 'stripe',
                state: 'VERIFIED_WITH_LIVE_PAYMENT',
                credentials: { 'stripe_account_id': 'acct_123example123' }
              }
            ]
          ),
          stripeUpdateAccountStub,
          servicePatch,
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
            gatewayAccountId,
            bankAccount: true,
            vatNumber: true,
            companyNumber: true,
            responsiblePerson: true,
            director: true
          })
        ])

        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
      })

      it('should display organisation URL page correctly when switching PSP', () => {
        cy.get('a').contains('Add organisation website address').click()

        cy.get('#organisation-url-form').should('exist')
          .within(() => {
            cy.get('input#organisation-url').should('exist')
          })
        cy.get('.govuk-back-link').should('contain', 'Back to Switching payment service provider (PSP)')
        cy.get('.govuk-back-link').should('have.attr', 'href', `/account/${gatewayAccountExternalId}/switch-psp`)
      })

      it('should submit organisation URL and redirect to switch PSP page', () => {
        cy.get('a').contains('Add organisation website address').click()

        cy.get('#organisation-url-form').within(() => {
          cy.get('#organisation-url').type('https://www.valid-url.com')
          cy.get('button').click()
        })

        cy.get('h1').should('contain', 'Switch payment service provider (PSP)')
      })

      it('should show an error if an invalid URL is submitted', () => {
        cy.get('a').contains('Add organisation website address').click()
        cy.get('#organisation-url-form').within(() => {
          cy.get('#organisation-url').type('invalid-url.com')
          cy.get('button').click()
        })

        cy.get('.govuk-error-summary').should('exist').within(() => {
          cy.get('a[href="#organisation-url"]').should('contain', 'Enter a valid website address')
        })
      })
    })

    describe('User does not have the correct permissions', () => {
      it('should show a permission error when the user does not have enough permissions', () => {
        cy.task('setupStubs', [
          userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
          gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
            gatewayAccountId,
            gatewayAccountExternalId,
            type: 'live',
            paymentProvider: 'stripe'
          }),
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, bankAccount: false })
        ])

        const organisationUrl = `/account/${gatewayAccountExternalId}/switch-psp/${gatewayAccountCredentialExternalId}/organisation-url`
        cy.visit(organisationUrl, {
          failOnStatusCode: false
        })
        cy.get('h1').should('contain', 'An error occurred')
        cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
      })
    })
  })
})
