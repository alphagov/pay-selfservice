'use strict'

const utils = require('../../utils/request-to-go-live-utils')
const { userExternalId, gatewayAccountId, serviceExternalId } = utils.variables

const pageUrl = `/service/${serviceExternalId}/request-to-go-live/organisation-address`

describe('The organisation address page', () => {
  const validLine1 = 'A building'
  const validLine2 = 'A street'
  const validCity = 'A city'
  const countryIe = 'IE'
  const countryGb = 'GB'
  const validPostcodeGb = 'E1 8QS'
  const validPostcodeIe = 'D01 F5P2'
  const invalidPostcode = '123'
  const validTelephoneNumber = '01134960000'
  const invalidTelephoneNumber = 'abd'
  const longText = 'This text is 256 ...............................................................................' +
    '...............................................................................................................' +
    '..................................characters long'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('The go-live stage is ENTERED_ORGANISATION_NAME and there are no existing merchant details', () => {
    beforeEach(() => {
      const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)

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

    it('should display errors when validation fails', () => {
      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          // create errors for all fields except country by leaving them blank or inputting invalid values
          cy.get('#address-line2').type(longText, { delay: 0 })
          cy.get('button').click()
        })

      cy.get('.govuk-error-summary').find('a').should('have.length', 4)
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#address-line1"]').should('contain', 'Building and street')
        cy.get('a[href="#address-city"]').should('contain', 'Town or city')
        cy.get('a[href="#address-postcode"]').should('contain', 'Postcode')
        cy.get('a[href="#telephone-number"]').should('contain', 'Telephone number')
      })

      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('.govuk-form-group--error > input#address-line1').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'This field cannot be blank')
          })
          cy.get('.govuk-form-group--error > input#address-line2').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'The text is too long')
            cy.get('input#address-line2').should('have.value', longText)
          })
          cy.get('.govuk-form-group--error > input#address-city').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'This field cannot be blank')
          })
          cy.get('.govuk-form-group--error > input#address-postcode').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'This field cannot be blank')
          })
          cy.get('.govuk-form-group--error > input#telephone-number').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'This field cannot be blank')
          })
        })
    })

    it('should keep entered responses when validation fails', () => {
      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('#address-line1').type(validLine1)
          cy.get('#address-line2').type(validLine2)
          cy.get('#address-city').type(validCity)
          cy.get('#address-country').select(countryIe)
          cy.get('#address-postcode').type(validPostcodeIe)
          cy.get('#telephone-number').type(invalidTelephoneNumber)
          cy.get('button').click()
        })

      cy.get('.govuk-error-summary').find('a').should('have.length', 1)
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#telephone-number"]').should('contain', 'Telephone number')
      })

      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('.govuk-form-group--error > input#telephone-number').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'Invalid telephone number')
          })

          cy.get('#address-line1').should('have.value', validLine1)
          cy.get('#address-line2').should('have.value', validLine2)
          cy.get('#address-city').should('have.value', validCity)
          cy.get('#address-country').should('have.value', countryIe)
          cy.get('#address-postcode').should('have.value', validPostcodeIe)
          cy.get('#telephone-number').should('have.value', invalidTelephoneNumber)
        })
    })

    it('should show errors for invalid postcode', () => {
      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('#address-line1').type(validLine1)
          cy.get('#address-line2').type(validLine2)
          cy.get('#address-city').type(validCity)
          cy.get('#address-country').select(countryGb)
          cy.get('#address-postcode').type(invalidPostcode)
          cy.get('#telephone-number').type(validTelephoneNumber)
          cy.get('button').click()
        })

      cy.get('.govuk-error-summary').find('a').should('have.length', 1)
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#address-postcode"]').should('contain', 'Postcode')
      })

      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('.govuk-form-group--error > input#address-postcode').parent().should('exist').within(() => {
            cy.get('.govuk-error-message').should('contain', 'Please enter a real postcode')
          })
        })
    })
  })

  describe('Valid details submitted', () => {
    beforeEach(() => {
      const initialServiceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
      const afterUpdateServiceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_ADDRESS')

      const getUserAndGateayAccountStubs = utils.getUserWithModifiedServiceRoleOnNextRequestStub(initialServiceRole, afterUpdateServiceRole)

      cy.task('setupStubs', [
        utils.patchUpdateServiceSuccessCatchAllStub('ENTERED_ORGANISATION_ADDRESS'),
        ...getUserAndGateayAccountStubs
      ])

      cy.visit(pageUrl)
    })

    it('should submit organisation address when validation succeeds', () => {
      cy.get(`form[method=post][action="/service/${serviceExternalId}/request-to-go-live/organisation-address"]`)
        .within(() => {
          cy.get('#address-line1').type(validLine1)
          cy.get('#address-line2').type(validLine2)
          cy.get('#address-city').type(validCity)
          cy.get('#address-country').select(countryGb)
          cy.get('#address-postcode').type(validPostcodeGb)
          cy.get('#telephone-number').type(validTelephoneNumber)
          cy.get('button').click()
        })

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/service/${serviceExternalId}/request-to-go-live/choose-how-to-process-payments`)
      })
    })
  })

  describe('There are existing organisation details', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('ENTERED_ORGANISATION_NAME')
    const merchantDetails = {
      address_line1: validLine1,
      address_line2: validLine2,
      address_city: validCity,
      address_country: countryIe,
      address_postcode: validPostcodeIe,
      telephone_number: validTelephoneNumber
    }
    serviceRole.service.merchant_details = merchantDetails

    it('should display form with existing details pre-filled', () => {
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
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
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
    })

    it('should show an error when the user does not have enough permissions', () => {
      cy.visit(pageUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain', 'An error occurred:')
      cy.get('#errorMsg').should('contain', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Service has invalid go live stage', () => {
    const serviceRole = utils.buildServiceRoleForGoLiveStage('NOT_STARTED')
    beforeEach(() => {
      utils.setupGetUserAndGatewayAccountStubs(serviceRole)
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
