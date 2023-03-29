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
      { gatewayAccountId, serviceExternalId, goLiveStage: 'CHOSEN_PSP_GOV_BANKING_WORLDPAY' },
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
    cy.setEncryptedCookies(userExternalId)
  })

  describe('Service has correct go live stage', () => {
    it('should display the page correctly', () => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_GOV_BANKING_WORLDPAY'))

      cy.visit(requestToGoLiveChooseTakesPaymentsOverThePhone)

      cy.get('h1').should('contain', 'Will you be taking payments over the phone?')
      cy.get('input#choose-takes-payments-over-phone').should('exist')

      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').should('exist')
      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').should('contain', 'Continue')

      cy.log('Check error is shown when no option is selected')
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

      // set up new stubs where the first time we get the service it returns the go_live_stage as CHOSEN_PSP_GOV_BANKING_WORLDPAY,
      // and the second time GOV_BANKING_MOTO_OPTION_COMPLETED so that the next page in the journey is loaded
      cy.task('clearStubs')
      setupStubsForSubmittingChoice('GOV_BANKING_MOTO_OPTION_COMPLETED')

      cy.get('input#choose-takes-payments-over-phone').check()
      cy.get('#request-to-go-live-choose-takes-payments-over-the-phone > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/agreement`)
      })
    })
  })

  describe('Service has wrong go live stage', () => {
    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      utils.setupGetUserAndGatewayAccountStubs(utils.buildServiceRoleForGoLiveStage('NOT_STARTED'))
      cy.visit(requestToGoLiveChooseTakesPaymentsOverThePhone)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('User does not have the correct permissions', () => {
    it('should show an error when the user does not have enough permissions', () => {
      const serviceRole = utils.buildServiceRoleForGoLiveStage('CHOSEN_PSP_GOV_BANKING_WORLDPAY')
      serviceRole.role = {
        permissions: []
      }
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)

      cy.visit(requestToGoLiveChooseTakesPaymentsOverThePhone, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })
})
