'use strict'

const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')

const userExternalId = 'authenticated-user-id'

describe('My services notification banner', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId: '1' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1' })
    ])
  })

  it(`should display the notification banner and hide it after clicking the 'Close' button`, () => {
    cy.setEncryptedCookies(userExternalId, 1)
    cy.visit('/my-services')
    cy.get('#my-services-whats-new-notification').should('exist')

    // click hide button and check hidden
    cy.get('#my-services-whats-new-notification__close-button').click()
    cy.get('#my-services-whats-new-notification').should('not.exist')

    // check not shown when page is reloaded
    cy.visit('/my-services')
    cy.get('#my-services-whats-new-notification').should('not.exist')
  })
})
