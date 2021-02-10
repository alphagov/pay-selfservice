'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'

describe('The index page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
    ])
  })

  it('should redirect to the My services page', () => {
    cy.visit('/')
    cy.get('h1').should('contain', 'You have 1 service')
    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/my-services`)
    })
  })
})
