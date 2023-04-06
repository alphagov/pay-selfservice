'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const variables = utils.variables
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')

const userExternalId = variables.userExternalId
const gatewayAccountId = variables.gatewayAccountId
const serviceExternalId = variables.serviceExternalId
const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`

function setupStubsForSubmittingChoice (nextGoLiveStage) {
  cy.task('setupStubs', [
    userStubs.getUserSuccessRespondDifferentlySecondTime(userExternalId,
      { gatewayAccountId, serviceExternalId, goLiveStage: 'ENTERED_ORGANISATION_ADDRESS' },
      { gatewayAccountId, serviceExternalId, goLiveStage: nextGoLiveStage }
    ),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
    utils.patchUpdateGoLiveStageSuccessStub(nextGoLiveStage)
  ])
}

describe('Request to go live: choose how to process payments', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('Service has correct go live stage and user selects Stripe account', () => {
    it('should allow user to select Stripe', () => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS'))

      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form').should('exist')
      cy.get('#choose-how-to-process-payments-mode').should('exist')
      cy.get('#choose-how-to-process-payments-mode-2').should('exist')

      // set up new stubs where the first time we get the service it returns the go_live_stage as ENTERED_ORGANISATION_ADDRESS,
      // and the second time CHOSEN_PSP_STRIPE so that the next page in the journey is loaded
      cy.task('clearStubs')
      setupStubsForSubmittingChoice('CHOSEN_PSP_STRIPE')

      cy.get('#choose-how-to-process-payments-mode').click()

      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Service has correct go live stage and user selects government banking account', () => {
    it('should allow choosing government banking and redirect to the page to choose whether to take MOTO payments', () => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS'))

      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      // set up new stubs where the first time we get the service it returns the go_live_stage as ENTERED_ORGANISATION_ADDRESS,
      // and the second time CHOSEN_PSP_GOV_BANKING_WORLDPAY so that the next page in the journey is loaded
      cy.task('clearStubs')
      setupStubsForSubmittingChoice('CHOSEN_PSP_GOV_BANKING_WORLDPAY')

      cy.get('#choose-how-to-process-payments-mode-2').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-takes-payments-over-phone`)
      })
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS'))
    })

    describe('No option selected', () => {
      it('should show "You need to select an option" error msg', () => {
        cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

        cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()

        cy.get('h2').should('contain', 'There is a problem')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'You need to select an option')
        cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#choose-how-to-process-payments-mode')

        cy.get('.govuk-form-group--error').should('exist').within(() => {
          cy.get('.govuk-error-message#choose-how-to-process-payments-mode-error').should('contain', 'You need to select an option')
        })

        cy.location().should((location) => {
          expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
        })
      })
    })
  })

  describe('Service has wrong go live stage', () => {
    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('User does not have the correct permissions', () => {
    it('should show an error when the user does not have enough permissions', () => {
      const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS')
      serviceRole.role = {
        permissions: []
      }
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)

      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Adminusers returns an error', () => {
    it('should show "An error occurred: There is a problem with the payments platform"', () => {
      cy.task('setupStubs', [
        ...utils.getUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS'),
          utils.patchUpdateGoLiveStageErrorStub('CHOSEN_PSP_STRIPE'))
      ])

      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#choose-how-to-process-payments-mode').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()

      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'There is a problem with the payments platform')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })
})
