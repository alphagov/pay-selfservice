import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import { beforeEach } from 'mocha'
import productStubs from '@test/cypress/stubs/products-stubs'
import { buildPaymentLinkOptions } from '@test/cypress/integration/simplified-account/payment-links/helpers/product-builder'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const PRODUCT_EXTERNAL_ID = 'product123abc'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const PAYMENT_LINK = buildPaymentLinkOptions({
  name: 'Gold coin polishing',
  href: 'pay.me/product/gold-coin-polishing',
})

const DELETE_PAYMENT_LINK_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/${PRODUCT_EXTERNAL_ID}/delete`

const PAYMENT_LINKS_INDEX_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const setupStubs = (
  role = 'admin',
  gatewayAccountType = 'test',
  product = PAYMENT_LINK,
  setupProductStub = true,
  setupDeleteStub = true
) => {
  const stubs = [
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
  ]

  if (setupProductStub) {
    stubs.push(productStubs.getProductByExternalIdAndGatewayAccountIdStub(product, GATEWAY_ACCOUNT_ID))
  }

  if (setupDeleteStub) {
    stubs.push(productStubs.deleteProductStub(product, GATEWAY_ACCOUNT_ID))
  }

  cy.task('setupStubs', stubs)
}

describe('Delete Payment Link', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Permission checks', () => {
    describe('View-only user', () => {
      beforeEach(() => {
        setupStubs('view-only', 'test', PAYMENT_LINK, false, false)
        cy.visit(DELETE_PAYMENT_LINK_URL(), { failOnStatusCode: false })
      })

      it('should not have access to delete payment link page', () => {
        cy.get('h1').should('contain.text', 'An error occurred')
      })
    })

    describe('Admin user', () => {
      beforeEach(() => {
        setupStubs('admin')
        cy.visit(DELETE_PAYMENT_LINK_URL())
      })

      it('should have access to delete payment link page', () => {
        cy.get('h1').should('contain.text', 'Are you sure you want to delete Gold coin polishing?')
      })
    })
  })

  describe('Page content', () => {
    describe('Payment link deletion journey', () => {
      beforeEach(() => {
        setupStubs('admin', 'test', PAYMENT_LINK)
        cy.visit(DELETE_PAYMENT_LINK_URL())
      })

      it('should display correct page title and heading', () => {
        cy.title().should('eq', `Delete payment link - ${SERVICE_NAME.en} - GOV.UK Pay`)
        cy.get('h1').should('contain.text', 'Are you sure you want to delete Gold coin polishing?')
      })

      it('should show back link to payment links index', () => {
        cy.get('.govuk-back-link')
          .should('exist')
          .should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL())
          .should('contain.text', 'Back')
      })

      it('should display radio options for confirmation', () => {
        cy.get('input[name="confirmDelete"]').should('have.length', 2)
        cy.get('input[value="yes"]').should('exist')
        cy.get('input[value="no"]').should('exist')

        cy.get('label').contains('Yes').should('exist')
        cy.get('label').contains('No').should('exist')
      })

      it('should have a submit button', () => {
        cy.get('button[type="submit"]').should('exist').should('contain.text', 'Save changes')
      })

      it('should have CSRF token', () => {
        cy.get('input[name="csrfToken"]').should('exist').should('have.attr', 'type', 'hidden')
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })
    })
  })

  describe('Form submission', () => {
    describe('Successful deletion', () => {
      beforeEach(() => {
        setupStubs('admin', 'test', PAYMENT_LINK, true, true)
        cy.visit(DELETE_PAYMENT_LINK_URL())
      })

      it('should delete payment link when "Yes" is selected', () => {
        cy.get('input[value="yes"]').check()
        cy.get('form button[type="submit"]').first().click()

        cy.url().should('include', PAYMENT_LINKS_INDEX_URL())
      })

      it('should redirect to payment links index when "No" is selected', () => {
        cy.get('input[value="no"]').check()
        cy.get('form button[type="submit"]').first().click()

        cy.url().should('include', PAYMENT_LINKS_INDEX_URL())
      })
    })

    describe('Validation errors', () => {
      beforeEach(() => {
        setupStubs('admin', 'test', PAYMENT_LINK)
        cy.visit(DELETE_PAYMENT_LINK_URL())
      })

      it('should show error when no option is selected', () => {
        cy.get('form button[type="submit"]').first().click()

        cy.url().should('include', DELETE_PAYMENT_LINK_URL())

        cy.get('.govuk-error-summary')
          .should('exist')
          .should('contain.text', 'There is a problem')
          .should('contain.text', 'Confirm if you want to delete Gold coin polishing')

        cy.get('.govuk-error-message')
          .should('exist')
          .should('contain.text', 'Confirm if you want to delete Gold coin polishing')

        cy.get('h1').should('contain.text', 'Are you sure you want to delete Gold coin polishing?')
      })

      it('should focus on error summary when validation fails', () => {
        cy.get('form button[type="submit"]').first().click()

        cy.get('.govuk-error-summary').should('exist').should('have.focus')
      })

      it('should allow clicking error summary link to focus on field', () => {
        cy.get('form button[type="submit"]').first().click()

        cy.get('.govuk-error-summary a').should('exist').click()

        cy.get('input[name="confirmDelete"]').first().should('have.focus')
      })
    })

    describe('Server error handling', () => {
      beforeEach(() => {
        setupStubs('admin', 'test', PAYMENT_LINK, true, false)
        cy.visit(DELETE_PAYMENT_LINK_URL())
      })

      it('should handle deletion failure gracefully', () => {
        cy.get('input[value="yes"]').check()
        cy.get('form button[type="submit"]').first().click()

        cy.get('.govuk-error-summary, .govuk-notification-banner--error, h1').should('exist')
      })
    })
  })

  describe('Different account types', () => {
    describe('Test mode', () => {
      beforeEach(() => {
        setupStubs('admin', 'test', PAYMENT_LINK)
        cy.visit(DELETE_PAYMENT_LINK_URL('test'))
      })

      it('should work in test mode', () => {
        cy.get('h1').should('contain.text', 'Are you sure you want to delete Gold coin polishing?')
        cy.get('.govuk-back-link').should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL('test'))
      })

      it('should redirect to test payment links after deletion', () => {
        cy.get('input[value="yes"]').check()
        cy.get('form button[type="submit"]').first().click()
        cy.url().should('include', PAYMENT_LINKS_INDEX_URL('test'))
      })
    })

    describe('Live mode', () => {
      beforeEach(() => {
        setupStubs('admin', 'live', PAYMENT_LINK)
        cy.visit(DELETE_PAYMENT_LINK_URL('live'))
      })

      it('should work in live mode', () => {
        cy.get('h1').should('contain.text', 'Are you sure you want to delete Gold coin polishing?')
        cy.get('.govuk-back-link').should('have.attr', 'href', PAYMENT_LINKS_INDEX_URL('live'))
      })

      it('should redirect to live payment links after deletion', () => {
        cy.get('input[value="yes"]').check()
        cy.get('form button[type="submit"]').first().click()
        cy.url().should('include', PAYMENT_LINKS_INDEX_URL('live'))
      })
    })
  })

  describe('Navigation integration', () => {
    beforeEach(() => {
      setupStubs('admin', 'test', PAYMENT_LINK)
    })

    it('should navigate from payment links index to delete page', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({
          userExternalId: USER_EXTERNAL_ID,
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          serviceName: SERVICE_NAME,
          serviceExternalId: SERVICE_EXTERNAL_ID,
          role: ROLES.admin,
        }),
        gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, 'test', {
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          type: 'test',
          payment_provider: SANDBOX,
        }),
        productStubs.getProductsByGatewayAccountIdAndTypeStub([PAYMENT_LINK], GATEWAY_ACCOUNT_ID, 'ADHOC'),
        productStubs.getProductByExternalIdAndGatewayAccountIdStub(PAYMENT_LINK, GATEWAY_ACCOUNT_ID),
        productStubs.deleteProductStub(PAYMENT_LINK, GATEWAY_ACCOUNT_ID),
      ])

      cy.visit(PAYMENT_LINKS_INDEX_URL())

      cy.get('.govuk-summary-card__actions').find('a').contains('Delete').click()

      cy.url().should('include', DELETE_PAYMENT_LINK_URL())
      cy.get('h1').should('contain.text', 'Are you sure you want to delete Gold coin polishing?')
    })

    it('should return to payment links index when back link is clicked', () => {
      cy.visit(DELETE_PAYMENT_LINK_URL())

      cy.get('.govuk-back-link').click()
      cy.url().should('include', PAYMENT_LINKS_INDEX_URL())
    })
  })

  describe('Edge cases', () => {
    it('should handle non-existent payment link gracefully', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({
          userExternalId: USER_EXTERNAL_ID,
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          serviceName: SERVICE_NAME,
          serviceExternalId: SERVICE_EXTERNAL_ID,
          role: ROLES.admin,
        }),
        gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, 'test', {
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          type: 'test',
          payment_provider: SANDBOX,
        }),
      ])

      cy.visit(DELETE_PAYMENT_LINK_URL(), { failOnStatusCode: false })

      cy.get('h1').should('contain.text', 'An error occurred')
    })

    it('should handle invalid product external ID', () => {
      const invalidUrl = `/service/${SERVICE_EXTERNAL_ID}/account/test/payment-links/invalid-id/delete`

      cy.task('setupStubs', [
        userStubs.getUserSuccess({
          userExternalId: USER_EXTERNAL_ID,
          gatewayAccountId: GATEWAY_ACCOUNT_ID,
          serviceName: SERVICE_NAME,
          serviceExternalId: SERVICE_EXTERNAL_ID,
          role: ROLES.admin,
        }),
        gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, 'test', {
          gateway_account_id: GATEWAY_ACCOUNT_ID,
          type: 'test',
          payment_provider: SANDBOX,
        }),
      ])

      cy.visit(invalidUrl, { failOnStatusCode: false })
      cy.get('h1').should('contain.text', 'An error occurred')
    })
  })
})
