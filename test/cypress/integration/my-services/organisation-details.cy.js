const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const serviceExternalId = 'a-service-external-id'
const validName = 'HMRC'
const validLine1 = 'A building'
const validLine2 = 'A street'
const validCity = 'A city'
const countryGb = 'GB'
const validPostcodeGb = 'E1 8QS'
const invalidPostcode = '123'
const validTelephoneNumber = '01134960000'
const invalidTelephoneNumber = 'abd'
const validUrl = 'https://www.example.com'
const invalidUrl = 'invalid.url'

const merchantDetails = {
  name: validName,
  address_line1: validLine1,
  address_line2: validLine2,
  address_city: validCity,
  address_country: countryGb,
  address_postcode: validPostcodeGb,
  telephone_number: validTelephoneNumber,
  url: validUrl
}

describe('The organisation details page', () => {
  it('should be able to enter organisation details', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId, paymentProvider: 'sandbox', type: 'test' }),
      serviceStubs.patchUpdateMerchantDetailsSuccess({
        serviceExternalId,
        gatewayAccountId,
        merchantDetails
      })
    ])

    cy.setEncryptedCookies(userExternalId)
    cy.visit('/my-services')
    cy.title().should('eq', 'My services - GOV.UK Pay')
    cy.get('.edit-merchant-details').click()

    cy.get('h1').should('contain', 'Organisation details')

    cy.get('label[for="merchant-name"]').should('exist')
    cy.get('input#merchant-name[name="merchant-name"]').should('exist')

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
    cy.get('#telephone-number-hint').should('exist')
    cy.get('input#telephone-number[name="telephone-number"]').should('exist')

    cy.get('label[for="url"]').should('exist')
    cy.get('#url-hint').should('exist')
    cy.get('input#url[name="url"]').should('exist')

    cy.log('Create errors by leaving fields blank or inputting invalid values')
    cy.get('#address-postcode').type(invalidPostcode, { delay: 0 })
    cy.get('#telephone-number').type(invalidTelephoneNumber, { delay: 0 })
    cy.get('#url').type(invalidUrl, { delay: 0 })

    cy.get('button').contains('Save organisation details').click()

    cy.get('.govuk-error-summary').find('a').should('have.length', 6)
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('a[href="#merchant-name"]').should('contain', 'Enter a name')
      cy.get('a[href="#address-line1"]').should('contain', 'Enter a building and street')
      cy.get('a[href="#address-city"]').should('contain', 'Enter a town or city')
      cy.get('a[href="#address-postcode"]').should('contain', 'Enter a real postcode')
      cy.get('a[href="#telephone-number"]').should('contain', 'Enter a telephone number')
      cy.get('a[href="#url"]').should('contain', 'Enter a valid website address')
    })

    cy.get('form[method=post]')
      .within(() => {
        cy.get('.govuk-form-group--error > input#merchant-name').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a name')
        })
        cy.get('.govuk-form-group--error > input#address-line1').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a building and street')
        })
        cy.get('.govuk-form-group--error > input#address-city').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a town or city')
        })
        cy.get('.govuk-form-group--error > input#address-postcode').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a real postcode')
        })
        cy.get('.govuk-form-group--error > input#telephone-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a telephone number')
        })
        cy.get('.govuk-form-group--error > input#url').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('contain', 'Enter a valid website address')
        })
      })

    cy.log('Fill in details for all fields to check values are displayed back when form is re-rendered with validation errors')
    cy.get('#merchant-name').type(validName, { delay: 0 })
    cy.get('#address-line1').type(validLine1, { delay: 0 })
    cy.get('#address-line2').type(validLine2, { delay: 0 })
    cy.get('#address-city').type(validCity, { delay: 0 })
    cy.get('#address-country').select(countryGb)
    cy.get('button').contains('Save organisation details').click()

    cy.get('.govuk-error-summary').find('a').should('have.length', 3)
    cy.get('.govuk-error-summary').should('exist').within(() => {
      cy.get('a[href="#address-postcode"]').should('contain', 'Enter a real postcode')
      cy.get('a[href="#telephone-number"]').should('contain', 'Enter a telephone number')
      cy.get('a[href="#url"]').should('contain', 'Enter a valid website address')
    })

    cy.get('#merchant-name').should('have.value', validName)
    cy.get('#address-line1').should('have.value', validLine1)
    cy.get('#address-line2').should('have.value', validLine2)
    cy.get('#address-city').should('have.value', validCity)
    cy.get('#address-country').should('have.value', countryGb)
    cy.get('#address-postcode').should('have.value', invalidPostcode)
    cy.get('#telephone-number').should('have.value', invalidTelephoneNumber)
    cy.get('#url').should('have.value', invalidUrl)

    cy.log('Enter valid details')
    cy.get('#address-postcode').clear()
    cy.get('#telephone-number').clear()
    cy.get('#url').clear()
    cy.get('#address-postcode').type(validPostcodeGb, { delay: 0 })
    cy.get('#telephone-number').type(validTelephoneNumber, { delay: 0 })
    cy.get('#url').type(validUrl, { delay: 0 })

    // set up new stubs so that when we click submit, the merchant details are displayed back
    cy.task('clearStubs')
    cy.task('setupStubs', [
      serviceStubs.patchUpdateMerchantDetailsSuccess({ serviceExternalId, gatewayAccountId, merchantDetails }),
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceExternalId, merchantDetails }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId, paymentProvider: 'sandbox', type: 'test' })
    ])

    cy.get('button').contains('Save organisation details').click()

    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/service/${serviceExternalId}/organisation-details`)
    })

    cy.get('td#merchant-name').should('contain', validName)

    cy.get('td#merchant-address').should('contain', validLine1)
    cy.get('td#merchant-address').should('contain', validLine2)
    cy.get('td#merchant-address').should('contain', validCity)
    cy.get('td#merchant-address').should('contain', validPostcodeGb)
    cy.get('td#merchant-address').should('contain', 'United Kingdom')

    cy.get('td#telephone-number').should('contain', validTelephoneNumber)
    cy.get('td#url').should('contain', validUrl)

    cy.get('a').contains('Change').should('have.attr', 'href', `/service/${serviceExternalId}/organisation-details/edit`)
  })
})
