'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'

function getUserAndAccountStubs (paymentProvider, providerSwitchEnabled, gatewayAccountCredentials, merchantDetails) {
  return [
    userStubs.getUserSuccess({ gatewayAccountId, userExternalId, merchantDetails }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, providerSwitchEnabled, paymentProvider, ...gatewayAccountCredentials && { gatewayAccountCredentials } })
  ]
}

describe('Verify PSP Integration page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('When switching to Worldpay', () => {
    beforeEach(() => {
      cy.task('setupStubs', getUserAndAccountStubs('smartpay', true, [
        { payment_provider: 'smartpay', state: 'ACTIVE' },
        { payment_provider: 'worldpay', state: 'ENTERED' }
      ]),
      stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
        gatewayAccountId
      }))
    })

    it('should display enabled live payment button', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration`)
      cy.percySnapshot()
      cy.get('h1').should('contain', 'Test the connection between Worldpay and GOV.UK Pay')
      cy.get('p').contains('Make a live payment of £2 with a debit or credit card')
      cy.get('button').should('exist')
      cy.get('button').should('contain', 'Continue to live payment')
      cy.get('button').should('be.not.disabled')
    })
  })

  describe('When switching to Stripe and cannot make a test payment', () => {
    beforeEach(() => {
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

    it('should display disabled live payment button', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration`)
      cy.percySnapshot()
      cy.get('h1').should('contain', 'Test the connection between Stripe and GOV.UK Pay')
      cy.get('p').contains('Stripe is still verifying your details.')
      cy.get('button').contains('Continue to live payment').should('not.exist')
    })
  })

  describe('When switching to Stripe and can make a test payment', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        ...getUserAndAccountStubs('smartpay', true, [
          { payment_provider: 'smartpay', state: 'ACTIVE' },
          { payment_provider: 'stripe', state: 'ENTERED' }
        ]),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
          gatewayAccountId
        })
      ])
    })

    it('should display enabled live payment button', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/switch-psp/verify-psp-integration`)
      cy.percySnapshot()
      cy.get('h1').should('contain', 'Test the connection between Stripe and GOV.UK Pay')
      cy.get('p').contains('Make a live payment of £2 with a debit or credit card')
      cy.get('button').should('exist')
      cy.get('button').should('contain', 'Continue to live payment')
      cy.get('button').should('be.not.disabled')
    })
  })
})
