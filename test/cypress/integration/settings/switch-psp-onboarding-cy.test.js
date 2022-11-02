'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'


function getUserAndAccountStubs (paymentProvider , providerSwitchEnabled, gatewayAccountCredentials, merchantDetails,) {
  return [
    userStubs.getUserSuccess({ gatewayAccountId, userExternalId, merchantDetails }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, providerSwitchEnabled, paymentProvider, ...gatewayAccountCredentials && { gatewayAccountCredentials } })
  ]
}

describe('Switch PSP settings page', () => {
  beforeEach(() => {  
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('When enable ENABLE_STRIPE_ONBOARDING_TASK_LIST is set to false', () => {  
    beforeEach(() => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = false
      cy.task('setupStubs', getUserAndAccountStubs('smartpay', null))
    })

    it('should not show stripe onboarding tasklist', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('.service-info--tag').should('not.contain', 'switching psp')
      cy.get('#navigation-menu-switch-psp').should('have.length', 0)
    })
  })


  describe('When stripe onboarding is switched to ', () => {
    describe('Switching page', () => {
      beforeEach(() => {
        process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = true
        cy.task('setupStubs', [
          ...getUserAndAccountStubs('smartpay', true, [
            { payment_provider: 'smartpay', state: 'ACTIVE' },
            { payment_provider: 'stripe', state: 'CREATED' }
          ]),
          stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
            gatewayAccountId
          })
        ])
      })
      afterEach(()=>{process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = false})
      it('shows Stripe specific tasks', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/switch-psp`)
        cy.get('.govuk-heading-l').should('contain', 'Switch payment service provider (PSP)')

        cy.get('strong[id="Add organisation website address-status"]').should('contain', 'not started')
        cy.get('span').contains('Add organisation website address').should('exist')
        cy.get('strong[id="Provide your bank details-status"]').should('contain', 'not started')
        cy.get('span').contains('Provide your bank details').should('exist')
        cy.get('strong[id="Provide details about your responsible person-status"]').should('contain', 'not started')
        cy.get('span').contains('Provide details about your responsible person').should('exist')
        cy.get('strong[id="Provide details about the director of your organisation-status"]').should('contain', 'not started')
        cy.get('span').contains('Provide details about the director of your organisation').should('exist')
        cy.get('strong[id="Provide your organisation’s VAT number-status"]').should('contain', 'not started')
        cy.get('span').contains('Provide your organisation’s VAT number').should('exist')
        cy.get('strong[id="Provide your Company registration number-status"]').should('contain', 'not started')
        cy.get('span').contains('Provide your Company registration number').should('exist')
        cy.get('strong[id="Confirm your organisation details-status"]').should('contain', 'not started')
        cy.get('span').contains('Confirm your organisation details').should('exist')
        cy.get('strong[id="Upload a government entity document-status"]').should('contain', 'not started')
        cy.get('span').contains('Upload a government entity document').should('exist')
        cy.get('strong[id="Make a live payment to test your Stripe PSP-status"]').should('contain', 'cannot start yet')
        cy.get('span').contains('Make a live payment to test your Stripe PSP').should('exist')
      })
    })
  })
})
