'use strict'

const utils = require('../../utils/request_to_go_live_utils')
const commonStubs = require('../../utils/common_stubs')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables

describe('Go live link on dashboard', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('Card gateway account', () => {
    describe('Go live link shown', () => {
      beforeEach(() => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
        cy.visit('/')
      })

      it('should show request to go live link when go-live stage is NOT_STARTED', () => {
        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Request to go live')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live`)
      })
    })

    describe('Continue link shown', () => {
      it('should show continue link when go-live stage is ENTERED_ORGANISATION_NAME', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Continue request to go live')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_STRIPE', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_STRIPE'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Continue request to go live')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live/agreement`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_WORLDPAY', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_WORLDPAY'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Continue request to go live')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live/agreement`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_SMARTPAY', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_SMARTPAY'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Continue request to go live')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live/agreement`)
      })

      it('should show continue link when go-live stage is CHOSEN_PSP_EPDQ', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_EPDQ'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'Continue request to go live')
        cy.get('#request-to-go-live-link a').should('have.attr', 'href', `/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })

    describe('Waiting to go live text shown', () => {
      it('should show waiting to go live text when go-live stage is TERMS_AGREED_STRIPE', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_STRIPE'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'We are doing some checks')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_WORLDPAY', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_WORLDPAY'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'We are doing some checks')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_SMARTPAY', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_SMARTPAY'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'We are doing some checks')
      })

      it('should show waiting to go live text when go-live stage is TERMS_AGREED_EPDQ', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('TERMS_AGREED_EPDQ'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('exist')
        cy.get('#request-to-go-live-link h2').should('contain', 'We are doing some checks')
      })
    })

    describe('Go live link not shown', () => {
      it('should not show request to go live link when go-live stage is LIVE', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('LIVE'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when go-live stage is DENIED', () => {
        utils.setupSimpleGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('DENIED'))
        cy.visit('/')

        cy.get('#request-to-go-live-link').should('not.exist')
      })

      it('should not show request to go live link when user is not an admin', () => {
        const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
        serviceRole.role = {
          permissions: []
        }
        utils.setupSimpleGetUserAndGatewayAccountStubs(serviceRole)

        cy.get('#request-to-go-live-link').should('not.exist')
      })
    })
  })

  describe('Direct debit gateway account', () => {
    it('should display next steps to go live link', () => {
      const directDebitGatewayAccountId = 'DIRECT_DEBIT:101'

      cy.task('setupStubs', [
        commonStubs.getUserStub(userExternalId, [directDebitGatewayAccountId], serviceExternalId, 'NOT_STARTED'),
        commonStubs.getDirectDebitGatewayAccountStub(directDebitGatewayAccountId, 'test', 'sandbox')
      ])
      cy.visit('/')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link h2').should('contain', 'Next steps to go live')
      cy.get('#request-to-go-live-link a').should('have.attr', 'href', 'https://docs.payments.service.gov.uk/switching_to_live/#switching-to-live')
    })
  })
})
