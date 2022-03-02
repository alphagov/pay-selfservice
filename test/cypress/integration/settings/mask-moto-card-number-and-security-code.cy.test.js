'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('MOTO mask security section', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const gatewayAccountExternalId = 'a-valid-external-id'
  const serviceName = 'Purchase a positron projection permit'

  function setupMotoStubs (opts = {}) {
    const stubs = []
    let user

    if (opts.readonly) {
      const role = {
        permissions: [
          {
            name: 'transactions-details:read',
            description: 'ViewTransactionsOnly'
          },
          {
            name: 'moto-mask-input:read',
            description: 'ViewMaskMotoOnly'
          }
        ]
      }
      user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, role })
    } else {
      user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })
    }
    const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      paymentProvider: opts.gateway,
      allowMoto: opts.allowMoto,
      motoMaskCardNumber: opts.motoMaskCardNumber,
      motoMaskSecurityCode: opts.motoMaskSecurityCode
    })
    const card = gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId, updated: false, maestro: opts.maestro })

    stubs.push(user, gatewayAccountByExternalId, card)

    cy.task('setupStubs', stubs)
  }

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('When accessing MOTO mask settings', () => {
    describe('when gateway account has allowMoto=false', () => {
      beforeEach(() => {
        setupMotoStubs({ allowMoto: false })
      })

      it('should not show mask security section', () => {
        cy.setEncryptedCookies(userExternalId)
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('#moto-mask-security-settings-heading').should('not.exist')
      })
    })

    describe('mask card number - when user has read permission and card number mask disabled', () => {
      beforeEach(() => {
        setupMotoStubs({ readonly: true, allowMoto: true, motoMaskCardNumber: false })
      })

      it('should show radios as disabled and card number mask disabled', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(5).should('contain', 'Hide card numbers')
        cy.get('.govuk-summary-list__value').eq(5).should('contain', 'Off')
        cy.get('.govuk-summary-list__actions a').eq(5).contains('View')
        cy.get('.govuk-summary-list__actions a').eq(5).click()
        cy.title().should('eq', `MOTO - hide card numbers for ${serviceName} - GOV.UK Pay`)
        cy.get('.pay-info-warning-box').should('exist')
        cy.get('input[value="on"]').should('be.disabled')
        cy.get('input[value="off"]').should('be.disabled')
        cy.get('input[value="on"]').should('not.be.checked')
        cy.get('input[value="off"]').should('be.checked')
      })
    })

    describe('mask card number - when user has update permission and card number mask disabled', () => {
      beforeEach(() => {
        setupMotoStubs({ readonly: false, allowMoto: true, motoMaskCardNumber: false })
      })

      it('should show radios as enabled and card number mask disabled', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(5).should('contain', 'Hide card numbers')
        cy.get('.govuk-summary-list__value').eq(5).should('contain', 'Off')
        cy.get('.govuk-summary-list__actions a').eq(5).contains('Change')
        cy.get('.govuk-summary-list__actions a').eq(5).click()
        cy.title().should('eq', `MOTO - hide card numbers for ${serviceName} - GOV.UK Pay`)
        cy.get('input[value="on"]').should('not.be.disabled')
        cy.get('input[value="off"]').should('not.be.disabled')
        cy.get('input[value="on"]').should('not.be.checked')
        cy.get('input[value="off"]').should('be.checked')
      })
    })

    describe('mask card number - when user has update permission and updates card number to enabled', () => {
      beforeEach(() => {
        setupMotoStubs({ readonly: false, allowMoto: true, motoMaskCardNumber: true })
      })

      it('should redirect to settings page and show success message', () => {
        cy.get('input[value="on"]').click()
        cy.get('#save-moto-mask-changes').click()
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
        })
        cy.get('.govuk-notification-banner--success').contains('Your changes have saved')
      })
    })

    describe('mask security code - when user has read permission and security code mask disabled', () => {
      beforeEach(() => {
        setupMotoStubs({ readonly: true, allowMoto: true, motoMaskSecurityCode: false })
      })

      it('should show radios as disabled and card number mask disabled', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(6).should('contain', 'Hide card security codes')
        cy.get('.govuk-summary-list__value').eq(6).should('contain', 'Off')
        cy.get('.govuk-summary-list__actions a').eq(6).contains('View')
        cy.get('.govuk-summary-list__actions a').eq(6).click()
        cy.title().should('eq', `MOTO - hide security codes for ${serviceName} - GOV.UK Pay`)
        cy.get('.pay-info-warning-box').should('exist')
        cy.get('input[value="on"]').should('be.disabled')
        cy.get('input[value="off"]').should('be.disabled')
        cy.get('input[value="on"]').should('not.be.checked')
        cy.get('input[value="off"]').should('be.checked')
      })
    })

    describe('mask security code - when user has update permission and security code mask disabled', () => {
      beforeEach(() => {
        setupMotoStubs({ readonly: false, allowMoto: true, motoMaskSecurityCode: false })
      })

      it('should show radios as enabled and no masking', () => {
        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.get('.govuk-summary-list__key').eq(6).should('contain', 'Hide card security codes')
        cy.get('.govuk-summary-list__value').eq(6).should('contain', 'Off')
        cy.get('.govuk-summary-list__actions a').eq(6).contains('Change')
        cy.get('.govuk-summary-list__actions a').eq(6).click()
        cy.title().should('eq', `MOTO - hide security codes for ${serviceName} - GOV.UK Pay`)
        cy.get('input[value="on"]').should('not.be.disabled')
        cy.get('input[value="off"]').should('not.be.disabled')
        cy.get('input[value="on"]').should('not.be.checked')
        cy.get('input[value="off"]').should('be.checked')
      })
    })

    describe('mask security code - when user has update permission and updates security code to enabled', () => {
      beforeEach(() => {
        setupMotoStubs({ readonly: false, allowMoto: true, motoMaskSecurityCode: true })
      })

      it('should redirect to settings page and show success message', () => {
        cy.get('input[value="on"]').click()
        cy.get('#save-moto-mask-changes').click()
        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
        })
        cy.get('.govuk-notification-banner--success').contains('Your changes have saved')
      })
    })
  })
})
