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

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const EDIT_PAYMENT_LINK_REFERENCE_URL = (serviceMode = 'test', paymentLink: Partial<ProductData>) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/${paymentLink.external_id}/edit/reference`

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
      reference_enabled: true,
      reference_label: 'enter your reference'
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
      cy.visit(EDIT_PAYMENT_LINK_REFERENCE_URL(GatewayAccountType.TEST, ENGLISH_PAYMENT_LINK), { failOnStatusCode: false })
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
        cy.visit(EDIT_PAYMENT_LINK_REFERENCE_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK))
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck({
          exclude: ['.govuk-skip-link', '.govuk-radios__input'] // https://accessibility.blog.gov.uk/2021/09/21/an-update-on-the-accessibility-of-conditionally-revealed-questions/
        })
      })

      it('english only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Edit live payment link')
        cy.get('#reference-type-custom').click()
        cy.get('#reference-label-hint').should('contain.text', 'For example, “invoice number”')
        cy.get('#reference-hint-hint').should('contain.text', 'Tell users what the payment reference looks like and where they can find it')
        cy.get('#service-content').find('.govuk-heading-s').should('contain.text', 'Example of what users will see')
        cy.get('#service-content')
          .find('img')
          .should('have.attr', 'src')
          .should('include', 'reference-page.svg')
      })
    })

    describe('Welsh payment link', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, WELSH_PAYMENT_LINK)
        cy.visit(EDIT_PAYMENT_LINK_REFERENCE_URL(GatewayAccountType.LIVE, WELSH_PAYMENT_LINK), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck({
          exclude: ['.govuk-skip-link', '.govuk-radios__input'] // https://accessibility.blog.gov.uk/2021/09/21/an-update-on-the-accessibility-of-conditionally-revealed-questions/
        })
      })

      it('welsh only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Edit live payment link (Welsh)')
        cy.get('#reference-type-custom').click()
        cy.get('#reference-label-hint').should('contain.text', 'For example, “rhif anfoneb”')
        cy.get('#reference-hint-hint').should('contain.text', 'Explain in Welsh what the payment reference looks like')
        cy.get('#service-content').find('.govuk-heading-s').should('not.exist')
        cy.get('#service-content').find('img').should('not.exist')
      })
    })

    describe('Page content', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK)
        cy.visit(EDIT_PAYMENT_LINK_REFERENCE_URL(GatewayAccountType.LIVE, ENGLISH_PAYMENT_LINK))
      })

      it('should navigate back to index view when back link is clicked', () => {
        cy.get('.service-pane').find('.govuk-back-link').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Live payment link details')
      })

      it('should validate form inputs', () => {
        cy.get('#reference-type-custom').click()

        cy.get('#service-content').find('form').find('#reference-label').click().focused().clear()

        cy.get('#service-content').find('form').find('button').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Please enter a reference')
        cy.get('#service-content').find('form').find('#reference-label').should('have.class', 'govuk-input--error')
      })

      it('should update payment link information', () => {
        cy.get('#reference-type-custom').click()
        cy.get('#service-content').find('form').find('#reference-label').click().focused().clear().type('enter your reference')
        cy.get('#service-content').find('form').find('button').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Live payment link details')
      })
    })
  })
})
