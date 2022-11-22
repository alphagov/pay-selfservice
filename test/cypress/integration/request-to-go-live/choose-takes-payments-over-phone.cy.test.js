'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const variables = utils.variables
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const serviceStubs = require('../../stubs/service-stubs')
const userStubs = require('../../stubs/user-stubs')

const userExternalId = variables.userExternalId
const gatewayAccountId = variables.gatewayAccountId
const serviceExternalId = variables.serviceExternalId
const requestToGoLiveChooseTakesPaymentsOverThePhone = `/service/${serviceExternalId}/request-to-go-live/choose-takes-payments-over-phone`

function setupStubsForSubmittingChoice (nextGoLiveStage) {
  cy.task('setupStubs', [
    userStubs.getUserSuccessRespondDifferentlySecondTime(userExternalId,
      { gatewayAccountId, serviceExternalId, goLiveStage: 'ENTERED_ORGANISATION_ADDRESS' },
      { gatewayAccountId, serviceExternalId, goLiveStage: nextGoLiveStage }
    ),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
    serviceStubs.patchUpdateServiceSuccessCatchAll({
      serviceExternalId: serviceExternalId,
      currentGoLiveStage: 'GOV_BANKING_MOTO_OPTION_COMPLETED',
      takesPaymentsOverPhone: true
    }),
    utils.patchUpdateGoLiveStageSuccessStub(nextGoLiveStage)
  ])
}

describe('Request to go live: choose takes payments over the phone', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('Service has correct go live stage', () => {
    it('should display the page correctly', () => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_GOV_BANKING_WORLDPAY'))

      cy.visit(requestToGoLiveChooseTakesPaymentsOverThePhone)

      cy.get('h1').should('contain', 'Will you be taking payments over the phone?')
      cy.get('input#choose-takes-payments-over-phone').should('exist')

      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').should('exist')
      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').should('contain', 'Continue')
    })

    it('should show error when no option is selected for `Will you be taking payments over the phone?`', () => {
      setupStubsForSubmittingChoice('GOV_BANKING_MOTO_OPTION_COMPLETED')
      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').click()

      cy.get('h2').should('contain', 'There is a problem')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'You need to select an option')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#choose-takes-payments-over-phone')

      cy.get('.govuk-form-group--error').should('exist').within(() => {
        cy.get('.govuk-error-message#choose-takes-payments-over-phone-error').should('contain', 'You need to select an option')
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-takes-payments-over-phone`)
      })
    })

    it('should patch adminusers and redirect to agreement', () => {
      setupStubsForSubmittingChoice('GOV_BANKING_MOTO_OPTION_COMPLETED')

      cy.get('input#choose-takes-payments-over-phone').check()
      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Service has wrong go live stage', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(requestToGoLiveChooseTakesPaymentsOverThePhone)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('User does not have the correct permissions', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      const serviceRole = utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_GOV_BANKING_WORLDPAY')
      serviceRole.role = {
        permissions: []
      }
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      cy.visit(requestToGoLiveChooseTakesPaymentsOverThePhone, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })
})
