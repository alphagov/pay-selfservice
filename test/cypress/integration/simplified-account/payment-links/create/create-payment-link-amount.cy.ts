import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'


const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const CREATE_PAYMENT_LINK_AMOUNT_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/amount`

const setupStubs = (role = 'admin', gatewayAccountType = 'test') => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: (ROLES as Record<string, object>)[role],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, gatewayAccountType, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: gatewayAccountType,
      payment_provider: SANDBOX,
    }),
  ])
}

describe('Edit payment link amount', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Non-admin view', () => {
    const USER_ROLE = 'view-only'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(CREATE_PAYMENT_LINK_AMOUNT_URL(GatewayAccountType.TEST), { failOnStatusCode: false })
    })

    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })
})