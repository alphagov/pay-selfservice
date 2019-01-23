describe('Request to go live: organisation name', () => {
  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')

  describe('NO PERMISSIONS', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveNoPermissionsCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveNoPermissionsCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_NO_PERMISSIONS')

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)
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

    it('should show "Request to go live: organisation name" page correctly with pre-filled organisation name', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', 'Government Digital Service')

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq('/service/rtglNotStarted/request-to-go-live/organisation-name')
      })
    })

    it('should show an error when blank name is submitted on "Request to go live: organisation name" page', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').clear()

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'What is the name of your organisation?')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#request-to-go-live-organisation-name-input')

      cy.get('input#request-to-go-live-organisation-name-input').should('have.class', 'govuk-input--error')
      cy.get('#request-to-go-live-organisation-name-form > div > h1 > label > span').should('contain', 'This field cannot be blank')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`)
      })
    })

    it('should show an error when name submitted exceeds max character length on "Request to go live: organisation name" page', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`
      const maxLengthOrganisationNameAllowed = 255
      const exceedMaxLengthOrganisationName = 'Lorem ipsum dolor sit ametf consectetuer adipiscing elitf Aenean commodo ligula eget dolorf Aenean massaf ' +
        'Cum sociis natoque penatibus et magnis dis parturient montesf nascetur ridiculus musl Donec quam felisf ultricies necf pellentesque eue pretium quislk'

      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').type(exceedMaxLengthOrganisationName)
      cy.get('input#request-to-go-live-organisation-name-input').invoke('val').then(val => val.length).should('be.gt', maxLengthOrganisationNameAllowed)

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'What is the name of your organisation?')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#request-to-go-live-organisation-name-input')

      cy.get('input#request-to-go-live-organisation-name-input').should('have.class', 'govuk-input--error')
      cy.get('#request-to-go-live-organisation-name-form > div > h1 > label > span').should('contain', 'The text is too long')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`)
      })
    })
  })

  describe('REQUEST_TO_GO_LIVE_STAGE_WRONG_STAGE', () => {
    beforeEach(() => {
      cy.setCookie('session', Cypress.env('encryptedSessionRequestToGoLiveStageEnteredOrganisationNameCookie'))
      cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountRequestToGoLiveStageEnteredOrganisationNameCookie'))
    })

    const selfServiceUser = selfServiceUsers.config.users.find(element => element.cypressTestingCategory === 'REQUEST_TO_GO_LIVE_STAGE_ENTERED_ORGANISATION_NAME')

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${selfServiceUser.service_roles[0].service.external_id}/request-to-go-live`)
      })
    })
  })
})
