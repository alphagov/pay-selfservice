'use strict'

describe('Request to go live: choose how to process payments', () => {
  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')

  describe('NO PERMISSIONS', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveNoPermissionsCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveNoPermissionsCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_NO_PERMISSIONS')

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLivePageOrganisationNameUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_WRONG_STAGE', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageChosenPspStripeCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageChosenPspStripeCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_STRIPE')

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED_STAGE', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageNotStartedCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageNotStartedCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED')

    it('should redirect to "Request to go live: index" page when in not started stage', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME')

    it('should display "Choose how to process payments" page when in ENTERED_ORGANISATION_NAME', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('h1').should('contain', 'Choose how to process payments')
      cy.get('#request-to-go-live-current-step').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form').should('exist')
      cy.get('#choose-how-to-process-payments-mode-1').should('exist')
      cy.get('#choose-how-to-process-payments-mode-2').should('exist')

      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('not.be.visible')

      cy.get('#choose-how-to-process-payments-mode-2').click()
      cy.get('#conditional-choose-how-to-process-payments-mode-2').should('be.visible')

      cy.get('#choose-how-to-process-payments-mode-other-1').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-1]').should('contain', 'Worldpay')

      cy.get('#choose-how-to-process-payments-mode-other-2').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-2]').should('contain', 'Smartpay')

      cy.get('#choose-how-to-process-payments-mode-other-3').should('exist')
      cy.get('#conditional-choose-how-to-process-payments-mode-2 label[for=choose-how-to-process-payments-mode-other-3]').should('contain', 'ePDQ')

      cy.get('#conditional-choose-how-to-process-payments-mode-2').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('exist')
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').should('contain', 'Continue')
    })
  })

  describe('should show an error when no option selected', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME')

    it('should show "You must choose an option" error msg', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.get('.error-summary').should('contain', 'You must select an option')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`)
      })
    })

    it('should show "You must select one of Worldpay, Smartpay or ePDQ" error msg', () => {
      const requestToGoLiveChooseHowToProcessPaymentUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`
      cy.visit(requestToGoLiveChooseHowToProcessPaymentUrl)

      cy.get('#choose-how-to-process-payments-mode-2').click()
      cy.get('#request-to-go-live-choose-how-to-process-payments-form > button').click()
      cy.get('.error-summary').should('contain', 'You must select one of Worldpay, Smartpay or ePDQ')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })
})
