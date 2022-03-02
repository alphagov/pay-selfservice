'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

describe('3DS settings page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const gatewayAccountExternalId = 'a-valid-external-id'
  const serviceName = 'Purchase a positron projection permit'

  function setup3dsStubs (opts = {}) {
    const stubs = []
    let user
    const role = {
      permissions: [
        {
          name: 'transactions-details:read',
          description: 'ViewTransactionsOnly'
        },
        {
          name: 'toggle-3ds:read',
          description: 'View3dsOnly'
        }
      ]
    }

    if (opts.readonly) {
      user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, role })
    } else {
      user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })
    }
    const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, paymentProvider: opts.gateway, requires3ds: opts.requires3ds })

    const card = gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId, updated: false, maestro: opts.maestro })

    stubs.push(user, gatewayAccountByExternalId, card)

    cy.task('setupStubs', stubs)
  }

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('When using an unsupported PSP', () => {
    beforeEach(() => {
      setup3dsStubs()
    })

    it('should not show on settings index and should show explainer and no radios', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('.govuk-summary-list__key').first().should('not.contain', '3D Secure')
      cy.visit(`/account/${gatewayAccountExternalId}/3ds`)
      cy.title().should('eq', `3D Secure - ${serviceName} - GOV.UK Pay`)
      cy.get('#threeds-not-supported').should('be.visible')
      cy.get('#threeds-not-supported').should('contain', '3D Secure is not currently supported for this payment service provider (PSP).')
      cy.get('form').should('have.length', 0)
    })
  })

  describe('When using Worldpay', () => {
    describe('with insufficient permissions', () => {
      beforeEach(() => {
        setup3dsStubs({ readonly: true, gateway: 'worldpay' })
      })

      it('should show info box and inputs should be disabled ', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'Off')
        cy.get('a').contains('View 3D Secure settings').click()
        cy.get('.pay-info-warning-box').should('be.visible')
        cy.get('.govuk-inset-text').should('have.length', 1)
        cy.get('input[value="on"]').should('be.disabled')
        cy.get('input[value="off"]').should('be.disabled')
        cy.get('.govuk-button').should('be.disabled')
      })
    })

    describe('with 3DS switched off', () => {
      beforeEach(() => {
        setup3dsStubs({ gateway: 'worldpay' })
      })

      it('should show Worldpay specific merchant code stuff and radios', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'Off')
        cy.get('a').contains('Change 3D Secure settings').click()
        cy.get('#threeds-not-supported').should('not.be.visible')
        cy.get('.govuk-inset-text').should('have.length', 1)
        cy.get('input[value="on"]').should('have.length', 1)
        cy.get('input[value="off"]').should('have.length', 1)
        cy.get('input[value="off"]').should('be.checked')
      })
    })

    describe('with 3DS switched on', () => {
      beforeEach(() => {
        setup3dsStubs({ requires3ds: true, gateway: 'worldpay' })
      })

      it('should show Worldpay specific merchant code stuff and radios', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
        cy.get('a').contains('Change 3D Secure settings').click()
        cy.get('#threeds-not-supported').should('not.be.visible')
        cy.get('.govuk-inset-text').should('have.length', 1)
        cy.get('input[value="on"]').should('have.length', 1)
        cy.get('input[value="on"]').should('be.checked')
        cy.get('input[value="off"]').should('have.length', 1)
      })
    })

    describe('with 3DS switched on with Maestro enabled too', () => {
      beforeEach(() => {
        setup3dsStubs({ requires3ds: true, gateway: 'worldpay', maestro: true })
      })

      it('should show Worldpay specific merchant code stuff and disabled radios', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
        cy.get('a').contains('Change 3D Secure settings').click()
        cy.get('#threeds-not-supported').should('not.be.visible')
        cy.get('.govuk-inset-text').should('have.length', 1)
        cy.get('input[value="on"]').should('have.length', 1)
        cy.get('input[value="on"]').should('be.checked')
        cy.get('input[value="on"]').should('be.disabled')
        cy.get('input[value="off"]').should('have.length', 1)
        cy.get('input[value="off"]').should('be.disabled')
        cy.get('.govuk-button').should('be.disabled')
        cy.get('.govuk-warning-text').should('be.visible')
        cy.get('.govuk-warning-text').should('contain', 'You must disable Maestro to turn off 3D Secure')
      })
    })

    describe('should change when clicked', () => {
      beforeEach(() => {
        setup3dsStubs({ gateway: 'worldpay' })
      })

      it('should have 3DS set to off', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'Off')
        cy.get('a').contains('Change 3D Secure settings').click()
        cy.get('input[value="on"]').should('not.be.checked')
        cy.get('input[value="off"]').should('be.checked')
        cy.get('input[value="on"]').click()
        cy.get('input[value="on"]').should('be.checked')
      })
    })
  })

  describe('should update when form submitted', () => {
    beforeEach(() => {
      setup3dsStubs({ requires3ds: true, gateway: 'worldpay' })
    })

    it('should redirect to settings page and show success message', () => {
      cy.get('#save-3ds-changes').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
      })
      cy.get('.govuk-notification-banner--success').should('contain', '3D secure settings have been updated')
      cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
      cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
    })
  })

  describe('When using Stripe', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe', requires3ds: true }),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe', requires3ds: true }),
        gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId, updated: false }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, vatNumber: true, bankAccount: true, companyNumber: true, responsiblePerson: true })
      ])
    })

    it('should show Stripe specific disabled message and radios', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('.govuk-summary-list__key').first().should('contain', '3D Secure')
      cy.get('.govuk-summary-list__value').first().should('contain', 'On')
      cy.get('a').contains('Change 3D Secure settings').click()
      cy.get('#threeds-not-supported').should('not.be.visible')
      cy.get('.govuk-inset-text').should('have.length', 0)
      cy.get('input[value="on"]').should('have.length', 1)
      cy.get('input[value="on"]').should('be.checked')
      cy.get('input[value="on"]').should('be.disabled')
      cy.get('input[value="off"]').should('have.length', 1)
      cy.get('input[value="off"]').should('be.disabled')
      cy.get('.govuk-button').should('be.disabled')
      cy.get('.govuk-warning-text').should('be.visible')
      cy.get('.govuk-warning-text').should('contain', '3D Secure setting cannot be changed for this payment service provider (PSP)')
    })
  })
})
