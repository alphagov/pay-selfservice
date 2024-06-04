'use strict'
const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userExternalId = 'abc'

function setupUser (isDegatewayed) {
  if (isDegatewayed === undefined) {
    throw new Error('You must specify whether the account is degatewayed or not')
  }
  cy.setEncryptedCookies(userExternalId)
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId,
      features: isDegatewayed ? 'default,degatewayaccountification' : 'default',
      gatewayAccountId: '42'
    }),
    gatewayAccountStubs.getGatewayAccountsSuccess({
      gatewayAccountId: '42',
      type: 'test',
      paymentProvider: 'sandbox'
    })
  ])
}

describe('Degateway', () => {

  describe('User is set up for degateway', () => {
    beforeEach(() => {
      setupUser(true)
    })

    it('should show degateway banner on the services page', () => {
      cy.visit('/my-services')
      cy.get('#degateway-phase-banner').should('exist')
    })

    it('should show degateway banner on user profile page', () => {
      cy.visit('/my-profile')
      cy.get('#degateway-phase-banner').should('exist')
    })
  })
  describe('User is not set up for degateway', () => {
    beforeEach(() => {
      setupUser(false)
    })

    it('should show degateway banner on the services page', () => {
      cy.visit('/my-services')
      cy.get('#degateway-phase-banner').should('not.exist')
    })

    it('should not show degateway banner on user profile page', () => {
      cy.visit('/my-profile')
      cy.get('#degateway-phase-banner').should('not.exist')
    })
  })
})
