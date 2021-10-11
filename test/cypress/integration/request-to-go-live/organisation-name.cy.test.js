'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const serviceStubs = require('../../stubs/service-stubs')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables
const notStartedServiceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`

describe('Request to go live: organisation name page', () => {
  const organisationName = 'Government Digital Service'

  const stubPatchRequests = (currentGoLiveStage, organisationName) => {
    return [
      serviceStubs.patchUpdateServiceGoLiveStageSuccess({ serviceExternalId, gatewayAccountId, currentGoLiveStage }),
      serviceStubs.patchUpdateMerchantDetailsSuccess({ serviceExternalId, gatewayAccountId, currentGoLiveStage, organisationName })
    ]
  }

  describe('User does not have the correct permissions', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
    serviceRole.role = { permissions: [] }
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      cy.visit(requestToGoLivePageOrganisationNameUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Service has invalid go live stage', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })
    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      const requestToGoLivePageOrganisationNameUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-name`
      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })

  describe('Service has NOT_STARTED go live stage and organisation name is not pre-filled', () => {
    beforeEach(() => {
      // keep the same session for entire describe block
      Cypress.Cookies.preserveOnce('session')
      Cypress.Cookies.preserveOnce('gateway_account')
    })

    it('should display an empty form', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', utils.getUserAndGatewayAccountStubs(notStartedServiceRole))

      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is your organisation called?')

      cy.get('#request-to-go-live-current-step').should('exist')

      cy.get('#request-to-go-live-organisation-name-form').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('exist')
      cy.get('input#request-to-go-live-organisation-name-input').should('be.empty')
      cy.get('#request-to-go-live-organisation-name-form > button').should('exist')
      cy.get('#request-to-go-live-organisation-name-form > button').should('contain', 'Continue')
    })

    it('should show errors on the page when no organisation name is submitted', () => {
      cy.task('setupStubs', utils.getUserAndGatewayAccountStubs(notStartedServiceRole))

      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.get('h2').should('contain', 'There is a problem')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter an organisation name')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#request-to-go-live-organisation-name-input')

      cy.get('.govuk-form-group--error > input#request-to-go-live-organisation-name-input').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter an organisation name')
      })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-name`)
      })
    })

    it('should allow the organisation name to be submitted', () => {
      const serviceRoleAfterSubmission = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
      cy.task('setupStubs', [
        ...stubPatchRequests('ENTERED_ORGANISATION_NAME', organisationName),
        ...utils.getUserAndGatewayAccountStubs(serviceRoleAfterSubmission)
      ])

      cy.get('input#request-to-go-live-organisation-name-input').type(organisationName)
      cy.get('#request-to-go-live-organisation-name-form > button').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/organisation-address`)
      })
    })
  })

  describe('Service has NOT_STARTED go live stage and organisation name is pre-filled', () => {
    it('should show form with pre-filled organisation name', () => {
      cy.setEncryptedCookies(userExternalId)

      const serviceRoleWithMerchantDetails = utils.buildServiceRoleWithMerchantDetails({ name: organisationName }, 'NOT_STARTED')
      cy.task('setupStubs', utils.getUserAndGatewayAccountStubs(serviceRoleWithMerchantDetails))

      cy.visit(requestToGoLivePageOrganisationNameUrl)

      cy.get('h1').should('contain', 'What is your organisation called?')
      cy.get('input#request-to-go-live-organisation-name-input').should('have.value', organisationName)
    })
  })
})
