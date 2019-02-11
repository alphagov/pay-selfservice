'use strict'

const lodash = require('lodash')
const utils = require('../../utils/request_to_go_live_utils')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables

describe('Request to go live: organisation name page', () => {
  const organisationName = 'Government Digital Service'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  const stubPatchRequests = (currentGoLiveStage, organisationName) => {
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
      name: 'patchSingleMerchantDetailsSuccess',
      opts: {
        external_id: serviceExternalId,
        gateway_account_ids: [gatewayAccountId],
        current_go_live_stage: currentGoLiveStage,
        path: 'merchant_details/name',
        value: organisationName
      }
    }]
  }

  describe('User does not have the correct permissions', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
    serviceRole.role = { permissions: [ ] }
    beforeEach(() => {
      utils.setupSimpleGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Service has invalid go live stage', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('INVALID_GO_LIVE_STAGE')
    beforeEach(() => {
      utils.setupSimpleGetUserAndGatewayAccountStubs(serviceRole)
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

  describe('Service has NOT_STARTED go live stage and organisation name is not pre-filled', () => {
    const serviceRoleBefore = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
    const serviceRoleAfter = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    const stubPayload = lodash.concat(
      utils.stubUserSuccessResponse(serviceRoleBefore, serviceRoleAfter),
      stubPatchRequests('ENTERED_ORGANISATION_NAME', organisationName))

    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should allow users to type valid organisation name and submit', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('be.empty')

      cy.get('input#request-to-go-live-organisation-name-input').type(organisationName)
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', organisationName)

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })

  describe('Service has NOT_STARTED go live stage and organisation name is pre-filled', () => {
    const serviceRoleBefore = utils.buildServiceRoleForMerchantDetailsField({ name: organisationName }, 'NOT_STARTED')
    const serviceRoleAfter = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    const changeOrganisationName = 'GDS'

    const stubPayload = lodash.concat(
      utils.stubUserSuccessResponse(serviceRoleBefore, serviceRoleAfter),
      stubPatchRequests('ENTERED_ORGANISATION_NAME', changeOrganisationName))

    beforeEach(() => {
      cy.task('setupStubs', stubPayload)
    })

    it('should show page correctly and allow users to change pre-filled organisation name successfully', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is the name of your organisation?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')

      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', organisationName)

      cy.get('input#request-to-go-live-organisation-name-input').clear()
      cy.get('input#request-to-go-live-organisation-name-input').type(changeOrganisationName)
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', changeOrganisationName)

      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })

  describe('Service has NOT_STARTED go live stage and there are validation errors on the page', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
    beforeEach(() => {
      utils.setupSimpleGetUserAndGatewayAccountStubs(serviceRole)
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
})
