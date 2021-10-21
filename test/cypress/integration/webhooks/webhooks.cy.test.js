const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const webhooksStubs = require('../../stubs/webhooks-stubs')

const userExternalId = 'some-user-id'
const gatewayAccountId = 10
const gatewayAccountExternalId = 'gateway-account-id'
const serviceExternalId = 'service-id'

const userAndGatewayAccountStubs = [
  userStubs.getUserSuccess({ userExternalId, serviceExternalId, gatewayAccountId }),
  gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, serviceExternalId }),
  webhooksStubs.getWebhooksListSuccess({ service_id: serviceExternalId, live: false })
]

describe('Webhooks', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should correctly list webhooks for a given service', () => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [ ...userAndGatewayAccountStubs ])

    cy.visit('/test/service/service-id/account/gateway-account-id/webhooks')
  })
})

