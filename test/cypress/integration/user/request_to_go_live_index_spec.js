describe('Request to go live: Index', () => {
  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')

  describe('no permissions', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveNoPermissionsCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveNoPermissionsCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_NO_PERMISSIONS')

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageNotStartedCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageNotStartedCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_NOT_STARTED')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Start now')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglNotStarted/request-to-go-live/organisation-name')
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglEnteredOrgName/request-to-go-live/choose-how-to-process-payments')
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_STRIPE', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageChosenPspStripeCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageChosenPspStripeCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_STRIPE')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglChosenPspStripe/request-to-go-live/agreement')
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_WORLDPAY', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageChosenPspWorldPayCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageChosenPspWorldPayCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_WORLDPAY')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglChosenPspWorldPay/request-to-go-live/agreement')
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_SMARTPAY', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageChosenPspSmartPayCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageChosenPspSmartPayCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_SMARTPAY')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglChosenPspSmartPay/request-to-go-live/agreement')
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_EPDQ', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageChosenPspEpdqCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageChosenPspEpdqCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_CHOSEN_PSP_EPDQ')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('not.exist')

      cy.get('#request-to-go-live-index-form > button').should('exist')
      cy.get('#request-to-go-live-index-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-index-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglChosenPspEpdq/request-to-go-live/agreement')
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_STRIPE', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageTermsAgreedStripeCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageTermsAgreedStripeCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_STRIPE')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_WORLDPAY', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageTermsAgreedWorldPayCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageTermsAgreedWorldPayCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_WORLDPAY')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_SMARTPAY', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageTermsAgreedSmartPayCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageTermsAgreedSmartPayCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_SMARTPAY')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_EPDQ', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageTermsAgreedEpdqCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageTermsAgreedEpdqCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_TERMS_AGREED_EPDQ')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_DENIED', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageDeniedCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageDeniedCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_DENIED')

    it('should show "Request to go live" page with an error', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('.govuk-error-summary h2').should('contain', 'There is a problem')
      cy.get('.govuk-error-summary .govuk-error-summary__list a')
        .should('contain', 'Please contact GOV.UK Pay support')
        .and('have.attr', 'href')
        .and('eq', 'https://www.payments.service.gov.uk/support/')
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_LIVE', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageLiveCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageLiveCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_LIVE')

    it('should show "Request to go live" page with correct progress indication', () => {
      const requestToGoLivePageUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`
      cy.visit(requestToGoLivePageUrl)
      cy.get('#request-to-go-live-step-1 > h3').should('exist')
      cy.get('#request-to-go-live-step-1 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-2 > h3').should('exist')
      cy.get('#request-to-go-live-step-2 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-step-3 > h3').should('exist')
      cy.get('#request-to-go-live-step-3 > h3 > span').should('contain', 'COMPLETED')

      cy.get('#request-to-go-live-index-form > button').should('not.exist')

      cy.get('.govuk-grid-column-full h3').should('contain', 'Your service is live')
    })
  })
})
