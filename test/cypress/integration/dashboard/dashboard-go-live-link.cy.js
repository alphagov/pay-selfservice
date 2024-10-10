'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const transactionStubs = require('../../stubs/transaction-stubs')
const { userExternalId, gatewayAccountExternalId, serviceExternalId } = utils.variables

const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

describe('Go live link on dashboard', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('Card gateway account', () => {
    describe('Go live link shown', () => {
      beforeEach(() => {
        setupStubs('NOT_STARTED')
        cy.visit(dashboardUrl)
      })

      it('should show request to go live link when go-live stage is NOT_STARTED', () => {
        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Request a live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })
    })

    describe('Continue link shown', () => {
      it('should show continue link when go-live stage is ENTERED_ORGANISATION_NAME', () => {
        setupStubs('ENTERED_ORGANISATION_NAME')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_STRIPE', () => {
        setupStubs('CHOSEN_PSP_STRIPE')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_GOV_BANKING_WORLDPAY', () => {
        setupStubs('CHOSEN_PSP_GOV_BANKING_WORLDPAY')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })
    })

    describe('Waiting to go live text shown', () => {
      it('should show waiting to go live text when go-live stage is TERMS_AGREED_STRIPE', () => {
        setupStubs('TERMS_AGREED_STRIPE')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_GOV_BANKING_WORLDPAY', () => {
        setupStubs('TERMS_AGREED_GOV_BANKING_WORLDPAY')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })
    })

    describe('Go live link not shown', () => {
      it('should not show Request a live account link when go-live stage is NOT_STARTED and account is a Worldpay test account', () => {
        setupStubs('NOT_STARTED', 'worldpay')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('not.contain', 'Request a live account')
      })

      it('should not show request to go live link when go-live stage is LIVE', () => {
        setupStubs('LIVE')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when go-live stage is DENIED', () => {
        setupStubs('DENIED')
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when user is not an admin', () => {
        const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
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
