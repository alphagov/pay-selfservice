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
})

const WELSH_PAYMENT_LINK = buildPaymentLinkOptions({
  name: 'Gloywi darn arian aur',
  href: 'pay.me/cynnyrch/gloywi-darn-arian-aur',
  description: 'blah',
  language: 'cy',
})

const PAYMENT_LINKS_URL = (serviceMode: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const PAYMENT_LINK_DETAILS_URL = (serviceMode: string, paymentLink: Partial<ProductData>) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/${paymentLink.external_id}`

const setupStubs = (role: string, gatewayAccountType: string, product = {}) => {
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
    productStubs.getProductsByGatewayAccountIdAndTypeStub(
      [ENGLISH_PAYMENT_LINK, WELSH_PAYMENT_LINK],
      GATEWAY_ACCOUNT_ID,
      'ADHOC'
    ),
  ])
}

describe('Edit payment link - view details', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Non-admin view', () => {
    const USER_ROLE = 'view-only'
    beforeEach(() => {
      setupStubs(USER_ROLE, GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK)
      cy.visit(PAYMENT_LINK_DETAILS_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK), { failOnStatusCode: false })
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
        cy.visit(PAYMENT_LINK_DETAILS_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })

      it('english only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Edit live payment link')
      })
    })

    describe('Welsh payment link', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, WELSH_PAYMENT_LINK)
        cy.visit(PAYMENT_LINK_DETAILS_URL(GatewayAccountType.LIVE, WELSH_PAYMENT_LINK), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })

      it('welsh only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Edit live payment link (Welsh)')
      })
    })

    describe('Page content', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK)
        cy.visit(PAYMENT_LINK_DETAILS_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK), { failOnStatusCode: false })
      })

      it('should display correct page title and heading', () => {
        cy.title().should('eq', 'Payment link details - McDuck Enterprises - GOV.UK Pay')
        cy.get('h1').should('contain.text', 'Payment link details')
      })

      it('should display summary list with all payment link details', () => {
        cy.get('.govuk-summary-list').should('exist')
        cy.get('.govuk-summary-list__row').should('have.length', 5)
      })

      it('should display title row with correct content and Change link', () => {
        cy.get('.govuk-summary-list__row')
          .eq(0)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Title')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Gold coin polishing')
            cy.get('.govuk-summary-list__actions').should('exist')
            cy.get('.govuk-summary-list__actions a')
              .should('contain.text', 'Change')
              .should('have.class', 'govuk-link--no-visited-state')
              .should('contain.text', 'title')
              .click()
          })

        cy.get('#service-content').find('h1').should('contain.text', 'Enter payment link details')
      })

      it('should display web address row with clickable link', () => {
        cy.get('.govuk-summary-list__row')
          .eq(1)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Web address')
            cy.get('.govuk-summary-list__value').should('contain', 'pay.me/product/gold-coin-polishing')
            cy.get('.govuk-summary-list__value a')
              .should('have.class', 'govuk-link--no-visited-state')
              .should('have.attr', 'href', 'pay.me/product/gold-coin-polishing')
            cy.get('.govuk-summary-list__actions').should('not.exist')
          })
      })

      it('should display details row with correct content and change link', () => {
        cy.get('.govuk-summary-list__row')
          .eq(2)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Details')
            cy.get('.govuk-summary-list__value').should('contain.text', 'blah')
            cy.get('.govuk-summary-list__actions').should('exist')
            cy.get('.govuk-summary-list__actions a')
              .should('contain.text', 'Change')
              .should('have.class', 'govuk-link--no-visited-state')
              .should('contain.text', 'details')
              .click()
          })

        cy.get('#service-content').find('h1').should('contain.text', 'Enter payment link details')
      })

      it('should display payment reference row with correct content and change link', () => {
        cy.get('.govuk-summary-list__row')
          .eq(3)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Payment reference')
            cy.get('.govuk-summary-list__value').should('contain.text', 'Created by GOV.UK Pay')
            cy.get('.govuk-summary-list__actions').should('exist')
            cy.get('.govuk-summary-list__actions a')
              .should('contain.text', 'Change')
              .should('have.class', 'govuk-link--no-visited-state')
              .should('contain.text', 'reference')
              .click()
          })
        cy.get('#service-content')
          .find('h1')
          .should('contain.text', 'Will your users already have a payment reference?')
      })

      it('should display payment amount row with correct content and change link', () => {
        cy.get('.govuk-summary-list__row')
          .eq(4)
          .within(() => {
            cy.get('.govuk-summary-list__key').should('contain.text', 'Payment amount')
            cy.get('.govuk-summary-list__value').should('contain.text', '£13.37')
            cy.get('.govuk-summary-list__actions').should('exist')
            cy.get('.govuk-summary-list__actions a')
              .should('contain.text', 'Change')
              .should('have.class', 'govuk-link--no-visited-state')
              .should('contain.text', 'contact details')
              .click()
          })
        cy.get('#service-content').find('h1').should('contain.text', 'Is the payment for a fixed amount?')
      })

      it('should navigate back to index view when back link is clicked', () => {
        cy.get('.service-pane').find('.govuk-back-link').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Live payment links')
      })
    })
  })
})
