const lodash = require('lodash')

describe('Request to go live: organisation name page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceExternalId = 'afe452323dd04d1898672bfaba25e3a6'
  const organisationName = 'Government Digital Service'

  const buildServiceRoleForGoLiveStage = (goLiveStage) => {
    return {
      service: {
        external_id: serviceExternalId,
        current_go_live_stage: goLiveStage,
        gateway_account_ids: [gatewayAccountId]
      }
    }
  }

  const simpleStub = (serviceRole) => {
    return [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [serviceRole]
        }
      },
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      }
    ]
  }

  const stubsWithGoLiveStageAndOrganisationName = (currentGoLiveStage = 'NOT_STARTED', organisationName = undefined) => {
    return [{
      name: 'patchUpdateServiceSuccess',
      opts: {
        external_id: serviceExternalId,
        gateway_account_ids: [gatewayAccountId],
        current_go_live_stage: currentGoLiveStage,
        path: 'current_go_live_stage',
        value: currentGoLiveStage
      }
    },
    {
      name: 'patchUpdateServiceSuccess',
      opts: {
        external_id: serviceExternalId,
        gateway_account_ids: [gatewayAccountId],
        current_go_live_stage: currentGoLiveStage,
        path: 'merchant_details/name',
        value: organisationName
      }
    }]
  }

  const setupStubs = (serviceRole) => {
    cy.task('setupStubs', simpleStub(serviceRole))
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('User does not have the correct permissions', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForGoLiveStage('NOT_STARTED')
      serviceRole.role = {
        permissions: []
      }
      setupStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Service has correct go live stage and organisation name is not pre-filled', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForGoLiveStage('NOT_STARTED')
      const stubPayload = lodash.concat(simpleStub(serviceRole), stubsWithGoLiveStageAndOrganisationName(
        'ENTERED_ORGANISATION_NAME'))
      cy.task('setupStubs', stubPayload)
    })

    it('should allow users to type valid organisation name and submit', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').type(organisationName)
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', organisationName)

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
    })

    it('should show empty input box if organisation name is not pre-filled', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('be.empty')
    })
  })

  describe('Service has correct go live stage and organisation name is pre-filled', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForGoLiveStage('NOT_STARTED')
      serviceRole.service.merchant_details = { name: organisationName }
      const stubPrefilledPayload = lodash.concat(simpleStub(serviceRole), stubsWithGoLiveStageAndOrganisationName(
        'ENTERED_ORGANISATION_NAME', organisationName))
      cy.task('setupStubs', stubPrefilledPayload)
    })

    it('should show page correctly with pre-filled organisation name', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', organisationName)

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
    })
  })

  describe('Service has correct go live stage and there are validation errors on the page', () => {
    beforeEach(() => {
      const stubPayload = lodash.concat(simpleStub(buildServiceRoleForGoLiveStage('NOT_STARTED')),
        stubsWithGoLiveStageAndOrganisationName())
      cy.task('setupStubs', stubPayload)
    })

    it('should show errors on the page when no organisation name is submitted', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.get('h2').should('contain', 'There was a problem with the details you gave for:')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'What is the name of your organisation?')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#request-to-go-live-organisation-name-input')

      cy.get('input#request-to-go-live-organisation-name-input').should('have.class', 'govuk-input--error')
      cy.get('#request-to-go-live-organisation-name-form > div > h1 > label > span').should('contain', 'This field cannot be blank')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })

    it('should show errors on the page when organisation name exceeds max character length is submitted', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
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
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })
  })

  describe('Service has invalid go live stage', () => {
    beforeEach(() => {
      const serviceRole = buildServiceRoleForGoLiveStage('INVALID_GO_LIVE_STAGE')
      setupStubs(serviceRole)
    })
    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'Request to go live')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })
})
