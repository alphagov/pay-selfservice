'use strict'

const commonStubs = require('../../utils/common-stubs')
const userStubs = require('../../utils/user-stubs')
const gatewayAccountStubs = require('../../utils/gateway-account-stubs')

describe('3DS settings page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Purchase a positron projection permit'

  function setup3dsStubs (opts = {}) {
    let stubs = []
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
    const gatewayAccount = gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, paymentProvider: opts.gateway, requires3ds: opts.requires3ds })

    const card = {
      name: 'getAcceptedCardTypesSuccess',
      opts: {
        account_id: gatewayAccountId,
        updated: false
      }
    }

    if (opts.maestro) {
      card.opts.maestro = opts.maestro
    }

    const patchUpdate = {
      name: 'patchUpdate3DS',
      opts: {
        toggle_3ds: true
      }
    }

    stubs.push(user, gatewayAccount, card, patchUpdate)

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
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/settings')
      cy.get('.govuk-summary-list__key').first().should('not.contain', '3D Secure')
      cy.visit('/3ds')
      cy.title().should('eq', `3D Secure - ${serviceName} - GOV.UK Pay`)
      cy.get('#threeds-not-supported').should('be.visible')
      cy.get('#threeds-not-supported').should('contain', '3D Secure is not currently supported for this payment service provider (PSP).')
      cy.get('form').should('have.length', 0)
    })
  })

  describe('When using Worldpay', () => {
    describe('with insufficient permissions', () => {
      beforeEach(() => {
        setup3dsStubs({
          readonly: true,
          gateway: 'worldpay'
        })
      })

      it('should show info box and inputs should be disabled ', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/settings')
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
        setup3dsStubs({
          gateway: 'worldpay'
        })
      })

      it('should show Worldpay specific merchant code stuff and radios', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/settings')
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
        setup3dsStubs({
          gateway: 'worldpay',
          requires3ds: true
        })
      })

      it('should show Worldpay specific merchant code stuff and radios', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/settings')
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
        setup3dsStubs({
          gateway: 'worldpay',
          requires3ds: true,
          maestro: true
        })
      })

      it('should show Worldpay specific merchant code stuff and disabled radios', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/settings')
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
        setup3dsStubs({
          gateway: 'worldpay'
        })
      })

      it('should show success message and radios should update', () => {
        cy.setEncryptedCookies(userExternalId, gatewayAccountId)
        cy.visit('/settings')
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
      setup3dsStubs({
        gateway: 'worldpay',
        requires3ds: true
      })
    })

    it('should show success message and radios should update', () => {
      cy.get('#save-3ds-changes').click()
      cy.get('input[value="on"]').should('be.checked')
      cy.get('input[value="off"]').should('not.be.checked')
      cy.get('.flash-container').should('contain', '3D secure settings have been updated')
      cy.get('#navigation-menu-settings').click()
      cy.get('.govuk-summary-list__key').eq(2).should('contain', '3D Secure')
      cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
    })
  })

  describe('When using Stripe', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe', requires3ds: true }),
        {
          name: 'getAcceptedCardTypesSuccess',
          opts: {
            account_id: gatewayAccountId,
            updated: false
          }
        },
        commonStubs.getGatewayAccountStripeSetupSuccess(gatewayAccountId, true, true, true, true)
      ])
    })

    it('should show Stripe specific disabled message and radios', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/settings')
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
