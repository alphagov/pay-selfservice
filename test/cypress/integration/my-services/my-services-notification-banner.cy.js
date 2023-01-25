'use strict'

const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')

const userExternalId = 'authenticated-user-id'

describe('My services notification banner', () => {
  it('Admin users - should display the notification banner and hide it after clicking the "Close" button', () => {
    const role = {
      name: 'admin'
    }
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId: '1', role }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1' })
    ])
    cy.setEncryptedCookies(userExternalId, 1)
    cy.visit('/my-services')
    cy.get('#my-services-notification-banner').should('exist')

    // click hide button and check hidden
    cy.get('#my-services-notification-banner__close-button').click()
    cy.get('#my-services-notification-banner').should('not.exist')

    // check not shown when page is reloaded
    cy.visit('/my-services')
    cy.get('#my-services-notification-banner').should('not.exist')
  })

  it('Non-admin users - should not display the notification banner', () => {
    const role = {
      name: 'view-only'
    }
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId: '1', role }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId: '1' })
    ])
    cy.setEncryptedCookies(userExternalId, 1)
    cy.visit('/my-services')
    cy.get('#my-services-notification-banner').should('not.exist')
  })
})
