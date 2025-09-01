import { beforeEach } from 'mocha'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'
import { buildPaymentLinkOptions } from '@test/cypress/integration/simplified-account/payment-links/helpers/product-builder'
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
  href: 'pay.me/product/gold-coin-polishing',
  description: 'blah',
  metadata: {
    alpha: 'beta'
  }
})

const WELSH_PAYMENT_LINK = buildPaymentLinkOptions({
  name: 'Gloywi darn arian aur',
  href: 'pay.me/cynnyrch/gloywi-darn-arian-aur',
  description: 'blah',
  language: 'cy',
  metadata: {
    gamma: 'theta'
  }
})

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const EDIT_PAYMENT_LINK_METADATA_URL = (serviceMode = 'test', paymentLink: Partial<ProductData>, columnKey: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/${paymentLink.external_id}/edit/reporting-column/${columnKey}`

const setupStubs = (role = 'admin', gatewayAccountType = 'test', product = {}) => {
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
    productStubs.patchUpdateProductSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      productExternalId: 'product123abc',
      name: 'Gold coin polishing',
      description: 'blah',
      price: 1337,
      reference_enabled: false,
      metadata: {
        upsilon: 'zeta'
      }
    }, {
      deepMatch: true
    }),
  ])
}

describe('Edit payment link reference', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Non-admin view', () => {
    const USER_ROLE = 'view-only'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(EDIT_PAYMENT_LINK_METADATA_URL(GatewayAccountType.TEST, ENGLISH_PAYMENT_LINK, 'alpha'), { failOnStatusCode: false })
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
        cy.visit(EDIT_PAYMENT_LINK_METADATA_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK, 'alpha'))
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck({
          exclude: ['.govuk-skip-link']
        })
      })

      it('english only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Edit live payment link')
      })
    })

    describe('Welsh payment link', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, WELSH_PAYMENT_LINK)
        cy.visit(EDIT_PAYMENT_LINK_METADATA_URL(GatewayAccountType.LIVE, WELSH_PAYMENT_LINK, 'gamma'), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck({
          exclude: ['.govuk-skip-link']
        })
      })

      it('welsh only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Edit live payment link (Welsh)')
      })
    })

    describe('Page content', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK)
        cy.visit(EDIT_PAYMENT_LINK_METADATA_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK, 'alpha'))
      })

      it('should navigate back to index view when back link is clicked', () => {
        cy.get('.service-pane').find('.govuk-back-link').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Live payment link details')
      })

      it('should validate form inputs', () => {
        cy.get('#service-content').find('form').find('#reporting-column').click().focused().clear()
        cy.get('#service-content').find('form').find('#cell-content').click().focused().clear()
        cy.get('#service-content').find('form').find('button').contains('Save changes').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter the column header')
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter the cell content')
        cy.get('#service-content').find('form').find('#reporting-column').should('have.class', 'govuk-input--error')
        cy.get('#service-content').find('form').find('#cell-content').should('have.class', 'govuk-input--error')
      })

      it('should update payment link information', () => {
        cy.get('#service-content').find('form').find('#reporting-column').click().focused().clear().type('upsilon')
        cy.get('#service-content').find('form').find('#cell-content').click().focused().clear().type('zeta')
        cy.get('#service-content').find('form').find('button').contains('Save changes').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Live payment link details')
      })
    })
  })
})
