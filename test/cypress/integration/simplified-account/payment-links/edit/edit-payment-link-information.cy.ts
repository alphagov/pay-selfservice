import { beforeEach } from 'mocha'
import {
  checkServiceNavigation,
} from '@test/cypress/integration/simplified-account/common/assertions'
import {
  buildPaymentLinkOptions
} from '@test/cypress/integration/simplified-account/payment-links/helpers/product-builder'
import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import productStubs from '@test/cypress/stubs/products-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import { ProductData } from '@models/products/dto/Product.dto'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const ENGLISH_PAYMENT_LINK = buildPaymentLinkOptions({
  name: 'Gold coin polishing',
  href: 'pay.me/product/gold-coin-polishing'
})

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const EDIT_PAYMENT_LINK_INFO_URL = (serviceMode = 'test', paymentLink: Partial<ProductData>) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/${paymentLink.external_id}/edit/information`

const setupStubs = (role = 'admin', gatewayAccountType = 'test', product = {} ) => {
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
    productStubs.getProductByExternalIdAndGatewayAccountIdStub(product, GATEWAY_ACCOUNT_ID),
  ])
}


describe('Edit payment link information', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Non-admin view', () => {
    const USER_ROLE = 'view-only'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(EDIT_PAYMENT_LINK_INFO_URL(GatewayAccountType.TEST, ENGLISH_PAYMENT_LINK), { failOnStatusCode: false })
    })

    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Admin view', () => {
    const USER_ROLE = 'admin'
    describe('English payment link', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK)
        cy.visit(EDIT_PAYMENT_LINK_INFO_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })

      it('')
    })
  })
})
