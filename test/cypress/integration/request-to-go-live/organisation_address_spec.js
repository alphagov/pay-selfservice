'use strict'

const utils = require('../../utils/request_to_go_live_utils')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables

const pageUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-address`

describe('The organisation address page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('The go-live stage is ENTERED_ORGANISATION_NAME and there are no existing merchant details', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    beforeEach(() => {
      utils.setupStubs(serviceRole)

      cy.visit(pageUrl)
    })

    it('should display form', () => {
      cy.get('h1').should('contain', `What is your organisation's address?`)

      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .should('exist')
        .within(() => {
          cy.get('label[for="address-line1"]').should('exist')
          cy.get('input#address-line1[name="address-line1"]').should('exist')
          cy.get('input#address-line2[name="address-line2"]').should('exist')

          cy.get('label[for="address-city"]').should('exist')
          cy.get('input#address-city[name="address-city"]').should('exist')

          cy.get('label[for="address-country"]').should('exist')
          cy.get('select#address-country[name="address-country"]').should('exist')

          cy.get('label[for="address-postcode"]').should('exist')
          cy.get('input#address-postcode[name="address-postcode"]').should('exist')

          cy.get('label[for="telephone-number"]').should('exist')
          cy.get('span#telephone-number-hint').should('exist')
          cy.get('input#telephone-number[name="telephone-number"]').should('exist')
        })
    })
  })

  describe('There are existing organisation details', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    const merchantDetails = {
      address_line1: 'A building',
      address_line2: 'A street',
      address_city: 'A city',
      address_country: 'IE',
      address_postcode: 'E8 4ER',
      telephone_number: '01134960000'
    }
    serviceRole.service.merchant_details = merchantDetails

    it('should display form with existing details pre-filled', () => {
      utils.setupStubs(serviceRole)
      cy.visit(`/service/${serviceExternalId}/request-to-go-live/organisation-address`)

      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('#address-line1').should('have.value', merchantDetails.address_line1)
          cy.get('#address-line2').should('have.value', merchantDetails.address_line2)
          cy.get('#address-city').should('have.value', merchantDetails.address_city)
          cy.get('#address-country').should('have.value', merchantDetails.address_country)
          cy.get('#address-postcode').should('have.value', merchantDetails.address_postcode)
          cy.get('#telephone-number').should('have.value', merchantDetails.telephone_number)
        })
    })
  })

  describe('User does not have the correct permissions', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    serviceRole.role = { permissions: [] }
    beforeEach(() => {
      utils.setupStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      cy.visit(pageUrl)
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Service has invalid go live stage', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
    beforeEach(() => {
      utils.setupStubs(serviceRole)
    })

    it('should redirect to "Request to go live: index" page when in wrong stage', () => {
      cy.visit(pageUrl)

      cy.get('h1').should('contain', 'Request a live account')

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live`)
      })
    })
  })
})
