import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX, WORLDPAY } from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const TEST_GATEWAY_ACCOUNT_ID = 117
const LIVE_GATEWAY_ACCOUNT_ID = 343

const setupStubs = (role = 'admin') => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountIds: [TEST_GATEWAY_ACCOUNT_ID, LIVE_GATEWAY_ACCOUNT_ID],
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: (ROLES as Record<string, object>)[role],
      goLiveStage: 'LIVE',
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, GatewayAccountType.TEST, {
      gateway_account_id: TEST_GATEWAY_ACCOUNT_ID,
      type: GatewayAccountType.TEST,
      payment_provider: SANDBOX,
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, GatewayAccountType.LIVE, {
      gateway_account_id: LIVE_GATEWAY_ACCOUNT_ID,
      type: GatewayAccountType.LIVE,
      payment_provider: WORLDPAY,
    }),
  ])
}

describe('enter sandbox mode journey', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)

    setupStubs()
  })

  describe('when in live mode', () => {
    it('should allow the user to enter sandbox mode', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/live/dashboard`)

      cy.get('#service-content').find('a').contains('Enter sandbox mode').click()

      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/live/enter-sandbox-mode`)

      cy.get('a.govuk-button').contains('Enter sandbox mode').click()

      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)
    })
  })

  describe('when in test mode', () => {
    it('should return an error if the user tries to access the enter sandbox mode page', () => {
      cy.request({
        url: `/service/${SERVICE_EXTERNAL_ID}/account/test/enter-sandbox-mode`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })

    it('should link directly to the live dashboard from the test dashboard', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/dashboard`)

      cy.get('#service-content').find('a').contains('Exit sandbox mode').click()

      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/live/dashboard`)
    })
  })
})
