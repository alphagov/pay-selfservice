'use strict'

const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const authenticatedUserId = 'authenticated-user-id'
const newServiceName = 'Pay for a thing'
const newServiceWelshName = 'Talu am beth'
const newServiceId = 'new-service-id'
const newGatewayAccountId = 38

const createGatewayAccountStub =
  gatewayAccountStubs.postCreateGatewayAccountSuccess({
    serviceName: newServiceName,
    serviceId: newServiceId,
    paymentProvider: 'sandbox',
    type: 'test',
    gatewayAccountId: newGatewayAccountId
  })

const assignUserRoleStub =
  userStubs.postAssignServiceRoleSuccess({ userExternalId: authenticatedUserId, serviceExternalId: newServiceId })

describe('Add a new service', () => {
  describe('Add a new service without a Welsh name', () => {
    it('should display the my services page', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
        gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1' }),
        createGatewayAccountStub,
        assignUserRoleStub,
        serviceStubs.postCreateServiceSuccess({
          serviceExternalId: newServiceId,
          gatewayAccountId: newGatewayAccountId,
          serviceName: { en: newServiceName }
        }),
        serviceStubs.patchUpdateServiceGatewayAccounts({ serviceExternalId: newServiceId })
      ])

      cy.setEncryptedCookies(authenticatedUserId)

      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')

      cy.get('a').contains('Add a new service').click()

      cy.title().should('eq', 'Add a new service - GOV.UK Pay')
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'false')

      cy.get('input#service-name').type(newServiceName)
      cy.get('button').contains('Add service').click()

      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })

  describe('Add a new service with a Welsh name', () => {
    it('should display the my services page', () => {
      cy.setEncryptedCookies(authenticatedUserId)
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
        gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1' }),
        createGatewayAccountStub,
        assignUserRoleStub,
        serviceStubs.postCreateServiceSuccess({
          serviceExternalId: newServiceId,
          gatewayAccountId: newGatewayAccountId,
          serviceName: { en: newServiceName, cy: newServiceWelshName }
        }),
        serviceStubs.patchUpdateServiceGatewayAccounts({ serviceExternalId: newServiceId })
      ])

      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')

      cy.get('a').contains('Add a new service').click()

      cy.title().should('eq', 'Add a new service - GOV.UK Pay')
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'false')

      cy.get('#checkbox-service-name-cy').click()
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'true')
      cy.get('input#service-name-cy').should('exist')

      cy.log('Enter a name that is too long and check validation errors are displayed')
      cy.get('input#service-name-cy').type('Lorem ipsum dolor sit amet, consectetuer adipiscing', { delay: 0 })
      cy.get('button').contains('Add service').click()

      cy.title().should('eq', 'Add a new service - GOV.UK Pay')

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

      cy.log('Enter a valid name')
      cy.get('input#service-name').clear()
      cy.get('input#service-name-cy').clear()
      cy.get('input#service-name').type(newServiceName)
      cy.get('input#service-name-cy').type(newServiceWelshName)
      cy.get('button').contains('Add service').click()

      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })
})
