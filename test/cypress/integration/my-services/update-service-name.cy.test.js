'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const authenticatedUserId = 'authenticated-user-id'
const serviceExternalId = 'service-external-id'
const newServiceName = 'Updated Service'
const serviceName = {
  en: 'My Service'
}
const welshServiceName = {
  en: 'My Service',
  cy: 'Cymru'
}

function setupStubs (serviceName, stubs = []) {
  cy.task('setupStubs', [
    ...stubs,
    userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1', serviceExternalId, serviceName }),
    gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1' })
  ])
}

describe('Update service name', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('Edit a service name without a Welsh name', () => {
    it('should display the my services page', () => {
      cy.setEncryptedCookies(authenticatedUserId)
      setupStubs(serviceName)

      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })

    it('should navigate to the edit service name form', () => {
      setupStubs(serviceName)
      cy.get('a').contains('Edit name').click()

      cy.title().should('eq', 'Edit service name - GOV.UK Pay')
      cy.get('#service-name').should('have.attr', 'value', 'My Service')
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'false')
    })

    it('should show a validation error when service name is empty', () => {
      setupStubs(serviceName)
      cy.get('input#service-name').clear()
      cy.get('button').contains('Save').click()

      cy.title().should('eq', 'Edit service name - GOV.UK Pay')

      cy.get('.govuk-error-summary').find('a').should('have.length', 1)
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#service-name"]').should('contain', 'Service name')
      })
      cy.get('.govuk-form-group--error > input#service-name').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'This field cannot be blank')
      })
    })

    it('should update service name to Updated Service', () => {
      setupStubs(serviceName,
        [serviceStubs.patchUpdateServiceNameSuccess({ serviceExternalId, serviceName: { en: newServiceName } })])
      cy.get('input#service-name').clear()
      cy.get('input#service-name').type(newServiceName)
      cy.get('button').contains('Save').click()

      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })

  describe('Edit a service name with a Welsh name', () => {
    it('should display the my services page', () => {
      cy.setEncryptedCookies(authenticatedUserId)
      setupStubs(welshServiceName)

      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })

    it('should navigate to the edit service name form', () => {
      setupStubs(welshServiceName)
      cy.get('a').contains('Edit name').click()

      cy.title().should('eq', 'Edit service name - GOV.UK Pay')
      cy.get('#service-name').should('have.attr', 'value', 'My Service')
      cy.get('#service-name-cy').should('have.attr', 'value', 'Cymru')
    })

    it('should update Welsh service name to Cymraeg', () => {
      setupStubs(welshServiceName,
        [serviceStubs.patchUpdateServiceNameSuccess({ serviceExternalId, serviceName: { en: newServiceName, cy: 'Cymraeg' } })])
      cy.get('input#service-name').clear()
      cy.get('input#service-name').type(newServiceName)
      cy.get('input#service-name-cy').clear()
      cy.get('input#service-name-cy').type('Cymraeg')
      cy.get('button').contains('Save').click()
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })
})
