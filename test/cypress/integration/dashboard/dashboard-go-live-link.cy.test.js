'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const { userExternalId, gatewayAccountExternalId, serviceExternalId } = utils.variables

const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

describe('Go live link on dashboard', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('Card gateway account', () => {
    describe('Go live link shown', () => {
      beforeEach(() => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
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
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_STRIPE', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_WORLDPAY', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_WORLDPAY'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_SMARTPAY', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_SMARTPAY'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_EPDQ', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_EPDQ'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Setting up your live account')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })
    })

    describe('Waiting to go live text shown', () => {
      it('should show waiting to go live text when go-live stage is TERMS_AGREED_STRIPE', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_STRIPE'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_WORLDPAY', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_WORLDPAY'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_SMARTPAY', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_SMARTPAY'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_EPDQ', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_EPDQ'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Your live account')
      })
    })

    describe('Go live link not shown', () => {
      it('should not show request to go live link when go-live stage is LIVE', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('LIVE'))
        cy.visit(dashboardUrl)

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when go-live stage is DENIED', () => {
        utils.setupGetUserAndGatewayAccountByExternalIdStubs(utils.buildServiceRoleForGoLiveStage('DENIED'))
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
})
