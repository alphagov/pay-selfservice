'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const transactionStubs = require('../../stubs/transaction-stubs')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')
const GoLiveStage = require('@models/constants/go-live-stage')
const PaymentProviders = require('@models/constants/payment-providers')
const { userExternalId, gatewayAccountExternalId, serviceExternalId } = utils.variables

const dashboardUrl = (gatewayAccountType = GatewayAccountType.TEST) => `/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`

describe('Go live link on dashboard', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('Card gateway account', () => {
    describe('Go live link shown', () => {
      beforeEach(() => {
        setupStubs(GoLiveStage.NOT_STARTED)
        cy.visit(dashboardUrl())
      })

      it('should show request to go live link when go-live stage is NOT_STARTED', () => {
        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Request a live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })
    })

    describe('Continue link shown', () => {
      it('should show continue link when go-live stage is ENTERED_ORGANISATION_NAME', () => {
        setupStubs(GoLiveStage.ENTERED_ORGANISATION_NAME)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_STRIPE', () => {
        setupStubs(GoLiveStage.CHOSEN_PSP_STRIPE)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_GOV_BANKING_WORLDPAY', () => {
        setupStubs(GoLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })
    })

    describe('Waiting to go live text shown', () => {
      it('should show waiting to go live text when go-live stage is TERMS_AGREED_STRIPE', () => {
        setupStubs(GoLiveStage.TERMS_AGREED_STRIPE)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_GOV_BANKING_WORLDPAY', () => {
        setupStubs(GoLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })
    })

    describe('Go live link not shown', () => {
      it('should not show Request a live account link when go-live stage is NOT_STARTED and account is a Worldpay test account', () => {
        setupStubs(GoLiveStage.NOT_STARTED, PaymentProviders.WORLDPAY)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when go-live stage is LIVE', () => {
        setupStubs(GoLiveStage.LIVE)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when go-live stage is DENIED', () => {
        setupStubs(GoLiveStage.DENIED)
        cy.visit(dashboardUrl())

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when user is not an admin', () => {
        const serviceRole = utils.buildServiceRoleForGoLiveStage(GoLiveStage.NOT_STARTED)
        serviceRole.role = {
          permissions: []
        }
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(serviceRole)

        cy.get('#request-to-go-live-link').should('not.exist')
      })
    })
  })

  function setupStubs (goLiveStage, paymentProvider) {
    cy.task('setupStubs', [
      ...utils.getUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage(goLiveStage), paymentProvider),
      transactionStubs.getTransactionsSummarySuccess()
    ])
  }
})
