'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const authenticatedUserId = 'authenticated-user-id'
const serviceExternalId = 'service-external-id'
const gatewayAccountId = '1'
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
    userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId, serviceExternalId, serviceName }),
    gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
  ])
}

describe('Update service name', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(authenticatedUserId)
  })

  describe('Edit a service name without a Welsh name', () => {
    it('should allow updating service name', () => {
      setupStubs(serviceName,
        [
          serviceStubs.patchUpdateServiceNameSuccess({
            serviceExternalId,
            serviceName: { en: newServiceName },
            gatewayAccountId
          }),
          gatewayAccountStubs.patchUpdateServiceNameSuccess(gatewayAccountId, newServiceName)
        ])

      cy.visit('/my-services')
      cy.title().should('eq', 'My services - GOV.UK Pay')

      cy.get('a').contains('Edit name').click()

      cy.title().should('eq', 'Edit service name - GOV.UK Pay')
      cy.get('#service-name').should('have.attr', 'value', 'My Service')
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'false')

      cy.get('input#service-name').clear()
      cy.get('input#service-name').type(newServiceName)
      cy.get('button').contains('Save').click()

      cy.title().should('eq', 'My services - GOV.UK Pay')
    })
  })

  describe('Edit a service name with a Welsh name', () => {
    it('should allow updating Welsh name', () => {
      setupStubs(welshServiceName,
        [serviceStubs.patchUpdateServiceNameSuccess({
          serviceExternalId,
          serviceName: { en: newServiceName, cy: 'Cymraeg' }
        })])

      cy.visit('/my-services')
      cy.title().should('eq', 'My services - GOV.UK Pay')

      cy.get('a').contains('Edit name').click()

      cy.title().should('eq', 'Edit service name - GOV.UK Pay')
      cy.get('#service-name').should('have.attr', 'value', 'My Service')
      cy.get('#service-name-cy').should('have.attr', 'value', 'Cymru')

      cy.log('check that validation errors are shown for both English and Welsh fields')
      cy.get('input#service-name').clear()
      cy.get('input#service-name-cy').type('Lorem ipsum dolor sit amet, consectetuer adipiscing', { delay: 0 })
      cy.get('button').contains('Save').click()

      cy.title().should('eq', 'Edit service name - GOV.UK Pay')

      cy.get('.govuk-error-summary').find('a').should('have.length', 2)
      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#service-name"]').should('contain', 'Enter a service name')
        cy.get('a[href="#service-name-cy"]').should('contain', 'Welsh service name must be 50 characters or fewer')
      })
      cy.get('.govuk-form-group--error > input#service-name').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Enter a service name')
      })
      cy.get('.govuk-form-group--error > input#service-name-cy').parent().should('exist').within(() => {
        cy.get('.govuk-error-message').should('contain', 'Welsh service name must be 50 characters or fewer')
      })

      cy.log('Enter a valid name and submit')
      cy.get('input#service-name').clear()
      cy.get('input#service-name').type(newServiceName)
      cy.get('input#service-name-cy').clear()
      cy.get('input#service-name-cy').type('Cymraeg')
      cy.get('button').contains('Save').click()
      cy.title().should('eq', 'My services - GOV.UK Pay')
    })
  })
})
