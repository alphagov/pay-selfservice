'use strict'

const { getGatewayAccountsStub } = require('../../utils/common-stubs')
const userStubs = require('../../utils/user-stubs')

const authenticatedUserId = 'authenticated-user-id'
const newServiceName = 'Pay for a thing'
const newServiceWelshName = 'Talu am beth'
const newServiceId = 'new-service-id'
const newGatewayAccountId = 38

const createGatewayAccountStub = {
  name: 'postCreateGatewayAccountSuccess',
  opts: {
    service_name: newServiceName,
    payment_provider: 'sandbox',
    type: 'test',
    gateway_account_id: newGatewayAccountId,
    verifyCalledTimes: 1
  }
}
const assignUserRoleStub = {
  name: 'postAssignServiceRoleSuccess',
  opts: {
    external_id: authenticatedUserId,
    service_external_id: newServiceId,
    role_name: 'admin',
    verifyCalledTimes: 1
  }
}

function getCreateServiceStub (englishName, welshName) {
  const serviceName = {
    en: englishName
  }
  if (welshName) {
    serviceName.cy = welshName
  }

  return {
    name: 'postCreateServiceSuccess',
    opts: {
      gateway_account_ids: [newGatewayAccountId],
      service_name: serviceName,
      external_id: newServiceId,
      verifyCalledTimes: 1
    }
  }
}

function setupStubs (stubs = []) {
  cy.task('setupStubs', [
    ...stubs,
    userStubs.getUserSuccess({ userExternalId: authenticatedUserId, gatewayAccountId: '1' }),
    getGatewayAccountsStub(1)
  ])
}

describe('Add a new service', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session')
    Cypress.Cookies.preserveOnce('gateway_account')
  })

  describe('Add a new service without a Welsh name', () => {
    it('should display the my services page', () => {
      cy.setEncryptedCookies(authenticatedUserId, 1)
      setupStubs()

      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })

    it('should navigate to the add new service form', () => {
      setupStubs()
      cy.get('a').contains('Add a new service').click()

      cy.title().should('eq', 'Add a new service - GOV.UK Pay')
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'false')
    })

    it('should add a service', () => {
      setupStubs([
        createGatewayAccountStub,
        assignUserRoleStub,
        getCreateServiceStub(newServiceName)
      ])
      cy.get('input#service-name').type(newServiceName)
      cy.get('button').contains('Add service').click()

      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })

  describe('Add a new service with a Welsh name', () => {
    it('should display the my services page', () => {
      cy.setEncryptedCookies(authenticatedUserId, 1)
      setupStubs()

      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })

    it('should navigate to the add new service form', () => {
      setupStubs()
      cy.get('a').contains('Add a new service').click()

      cy.title().should('eq', 'Add a new service - GOV.UK Pay')
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'false')
    })

    it('should display Welsh name input', () => {
      setupStubs()
      cy.get('#checkbox-service-name-cy').click()
      cy.get('#checkbox-service-name-cy').should('have.attr', 'aria-expanded', 'true')
      cy.get('input#service-name-cy').should('exist')
    })

    it('should add a service', () => {
      setupStubs([
        createGatewayAccountStub,
        assignUserRoleStub,
        getCreateServiceStub(newServiceName, newServiceWelshName)
      ])
      cy.get('input#service-name').type(newServiceName)
      cy.get('input#service-name-cy').type(newServiceWelshName)
      cy.get('button').contains('Add service').click()

      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })
})
