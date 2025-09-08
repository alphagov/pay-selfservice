import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import {
  checkServiceNavigation,
} from '@test/cypress/integration/simplified-account/common/assertions'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const CREATE_PAYMENT_LINK_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/create`

const CREATE_PAYMENT_LINK_REFERENCE_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/reference`

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

describe('Create payment link journey', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('Admin view', () => {
    const USER_ROLE = 'admin'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), { failOnStatusCode: false })
    })

    describe('English payment link', () => {
      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('test'))
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })

      it('English only ui functions', () => {
        cy.get('h1').should('contain', 'Enter payment link details')
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')
        cy.get('#service-content').find('form').find('#name')
          .click().focused()
          .type('A payment link name')
        cy.get('#service-content').find('form').find('button').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(CREATE_PAYMENT_LINK_REFERENCE_URL(GatewayAccountType.TEST))
        })
        cy.get('h1').should('contain', 'Will your users already have a payment reference?')
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')

        cy.get('input[type=radio]#reference-type-custom').should('exist')
        cy.get('input[type=radio]#reference-type-standard').should('exist')
        cy.get('input[type=radio]#reference-type-standard').click()
        cy.get('#service-content').find('form').find('button').click()

        cy.location().should((location) => {
          expect(location.pathname).to.eq(CREATE_PAYMENT_LINK_AMOUNT_URL(GatewayAccountType.TEST))
        })
        cy.get('h1').should('contain', 'Is the payment for a fixed amount?')
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')
      })
    })
  })
})

