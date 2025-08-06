import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import { beforeEach } from 'mocha'
import productStubs from '@test/cypress/stubs/products-stubs'
import { buildPaymentLinkOptions } from '@test/cypress/integration/simplified-account/payment-links/helpers/product-builder'
import {
  checkServiceNavigation,
  checkTitleAndHeading,
} from '@test/cypress/integration/simplified-account/common/assertions'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const PAYMENT_LINK_1 = buildPaymentLinkOptions({
  name: 'Gold coin polishing',
  href: 'pay.me/product/gold-coin-polishing',
})

const PAYMENT_LINK_2 = buildPaymentLinkOptions({
  name: 'Designer monocles',
  href: 'pay.me/product/designer-monocles',
})

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const setupStubs = (role = 'admin', gatewayAccountType = 'test', products: object[] = []) => {
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
    productStubs.getProductsByGatewayAccountIdAndTypeStub(products, GATEWAY_ACCOUNT_ID, 'ADHOC'),
  ])
}

describe('PaymentLinks dashboard', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Non-admin view', () => {
    const USER_ROLE = 'view-only'
    describe('Common page content', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE)
        cy.visit(PAYMENT_LINKS_URL(), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL())
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })
    })

    describe('Test mode', () => {
      const SERVICE_MODE = 'test'
      describe('Existing payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE, [PAYMENT_LINK_1, PAYMENT_LINK_2])
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('test mode ui elements are present', () => {
          checkTitleAndHeading('Test payment links', SERVICE_NAME.en)

          cy.get('.service-pane').within(() => {
            cy.get('.govuk-inset-text')
              .should('exist')
              .should('contain.text', "You don't have permission to create or edit payment links.")

            cy.get('.govuk-warning-text')
              .should('exist')
              .should('contain.text', 'Test payment links will not work for paying users.')

            cy.get('h2')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Prefill payment link fields')
                cy.wrap($elements.eq(1)).should('contain.text', 'Test payment links (2)')
              })

            cy.get('.govuk-body')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should(
                  'contain.text',
                  'You can use test payment links to see how your service will work.'
                )
                cy.wrap($elements.eq(1)).should(
                  'contain.text',
                  'You can test prefilling the amount, reference or both for users.'
                )
              })

            cy.get('.govuk-summary-card')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).get('.govuk-summary-card__actions').should('not.exist')
                cy.wrap($elements.eq(1)).get('.govuk-summary-card__actions').should('not.exist')
              })
          })
        })
      })
      describe('No payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE)
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('test mode ui elements are present', () => {
          checkTitleAndHeading('Test payment links', SERVICE_NAME.en)
          cy.get('.service-pane').within(() => {
            cy.get('.govuk-inset-text')
              .should('exist')
              .should('contain.text', "You don't have permission to create or edit payment links.")
            cy.get('.govuk-warning-text').should('not.exist')
            cy.get('.govuk-body').should('have.length', 1).should('contain.text', 'There are no payment links.')
          })
        })
      })
    })

    describe('Live mode', () => {
      const SERVICE_MODE = 'live'
      describe('Existing payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE, [PAYMENT_LINK_1, PAYMENT_LINK_2])
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('live mode ui elements are present', () => {
          checkTitleAndHeading('Live payment links', SERVICE_NAME.en)

          cy.get('.service-pane').within(() => {
            cy.get('.govuk-inset-text')
              .should('exist')
              .should('contain.text', "You don't have permission to create or edit payment links.")

            cy.get('.govuk-warning-text').should('not.exist')

            cy.get('h2')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Prefill payment link fields')
                cy.wrap($elements.eq(1)).should('contain.text', 'Live payment links (2)')
              })

            cy.get('.govuk-body')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should(
                  'contain.text',
                  'You can send payment links to your users so they can pay you.'
                )
                cy.wrap($elements.eq(1)).should(
                  'contain.text',
                  'You can test prefilling the amount, reference or both for users.'
                )
              })

            cy.get('.govuk-summary-card')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).get('.govuk-summary-card__actions').should('not.exist')
                cy.wrap($elements.eq(1)).get('.govuk-summary-card__actions').should('not.exist')
              })
          })
        })
      })
      describe('No payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE)
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('live mode ui elements are present', () => {
          checkTitleAndHeading('Live payment links', SERVICE_NAME.en)
          cy.get('.service-pane').within(() => {
            cy.get('.govuk-inset-text')
              .should('exist')
              .should('contain.text', "You don't have permission to create or edit payment links.")
            cy.get('.govuk-warning-text').should('not.exist')
            cy.get('.govuk-body').should('have.length', 1).should('contain.text', 'There are no payment links.')
          })
        })
      })
    })
  })

  describe('Admin view', () => {
    const USER_ROLE = 'admin'
    describe('Common page content', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE, 'live', [PAYMENT_LINK_1, PAYMENT_LINK_2])
        cy.visit(PAYMENT_LINKS_URL('live'), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
      })

      it('accessibility check', () => {
        cy.a11yCheck()
      })
    })

    describe('Test mode', () => {
      const SERVICE_MODE = 'test'
      describe('Existing payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE, [PAYMENT_LINK_1, PAYMENT_LINK_2])
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('test mode ui elements are present', () => {
          checkTitleAndHeading('Test payment links', SERVICE_NAME.en)

          cy.get('.service-pane').within(() => {
            cy.get('.govuk-accordion__section-toggle').click()
            cy.get('ol').find('li').should('have.length', 6)

            cy.get('.govuk-inset-text').should('not.exist')

            cy.get('.govuk-warning-text')
              .should('exist')
              .should('contain.text', 'Test payment links will not work for paying users.')

            cy.get('h2')
              .should('have.length', 4)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Prefill payment link fields')
                cy.wrap($elements.eq(1)).should('contain.text', 'Add metadata for reconciliation and reporting')
                cy.wrap($elements.eq(2)).should('contain.text', 'See an example payment link')
                cy.wrap($elements.eq(3)).should('contain.text', 'Test payment links (2)')
              })

            cy.get('.govuk-body')
              .should('have.length', 10)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should(
                  'contain.text',
                  'You can create test payment links to see how your service will work.'
                )
                cy.wrap($elements.eq(1)).should(
                  'contain.text',
                  'You can test prefilling the amount, reference or both for users.'
                )
                cy.wrap($elements.eq(2)).should(
                  'contain.text',
                  'You can test adding metadata like cost centre codes or business area to your test payment links.'
                )
              })

            cy.get('.govuk-button-group')
              .find('a')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link')
                cy.wrap($elements.eq(1)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link in Welsh')
              })

            cy.get('.govuk-summary-card')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0))
                  .find('.govuk-summary-card__actions')
                  .should('exist')
                  .find('a')
                  .should('have.length', 2)
                  .then(($elements) => {
                    cy.wrap($elements.eq(0)).contains('Edit') // todo navigate to the page once implemented
                    cy.wrap($elements.eq(1)).contains('Delete') // todo navigate to the page once implemented
                  })
                cy.wrap($elements.eq(1))
                  .find('.govuk-summary-card__actions')
                  .should('exist')
                  .find('a')
                  .should('have.length', 2)
                  .then(($elements) => {
                    cy.wrap($elements.eq(0)).contains('Edit') // todo navigate to the page once implemented
                    cy.wrap($elements.eq(1)).contains('Delete') // todo navigate to the page once implemented
                  })
              })
          })
        })
      })
      describe('No payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE)
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('test mode ui elements are present', () => {
          checkTitleAndHeading('Test payment links', SERVICE_NAME.en)
          cy.get('.service-pane').within(() => {
            cy.get('.govuk-accordion__section-toggle').click()
            cy.get('ol').find('li').should('have.length', 6)

            cy.get('.govuk-inset-text').should('not.exist')

            cy.get('.govuk-warning-text').should('not.exist')

            cy.get('h2')
              .should('have.length', 3)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Prefill payment link fields')
                cy.wrap($elements.eq(1)).should('contain.text', 'Add metadata for reconciliation and reporting')
                cy.wrap($elements.eq(2)).should('contain.text', 'See an example payment link')
              })

            cy.get('.govuk-body')
              .should('have.length', 10)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should(
                  'contain.text',
                  'You can create test payment links to see how your service will work.'
                )
                cy.wrap($elements.eq(1)).should(
                  'contain.text',
                  'You can test prefilling the amount, reference or both for users.'
                )
                cy.wrap($elements.eq(2)).should(
                  'contain.text',
                  'You can test adding metadata like cost centre codes or business area to your test payment links.'
                )
              })

            cy.get('.govuk-button-group')
              .find('a')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link')
                cy.wrap($elements.eq(1)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link in Welsh')
              })

            cy.get('.govuk-summary-card').should('not.exist')
          })
        })
      })
    })

    describe('Live mode', () => {
      const SERVICE_MODE = 'live'
      describe('Existing payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE, [PAYMENT_LINK_1])
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('live mode ui elements are present', () => {
          checkTitleAndHeading('Live payment links', SERVICE_NAME.en)

          cy.get('.service-pane').within(() => {
            cy.get('h2')
              .should('have.length', 4)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Prefill payment link fields')
                cy.wrap($elements.eq(1)).should('contain.text', 'Add metadata for reconciliation and reporting')
                cy.wrap($elements.eq(2)).should('contain.text', 'See an example payment link')
                cy.wrap($elements.eq(3)).should('contain.text', 'Live payment links (1)')
              })

            cy.get('.govuk-inset-text').should('not.exist')

            cy.get('.govuk-warning-text').should('not.exist')

            cy.get('.govuk-body')
              .should('have.length', 10) // accordion paragraphs are visually hidden but still in the DOM
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should(
                  'contain.text',
                  'You can create payment links and send them to your users so they can pay you.'
                )
                cy.wrap($elements.eq(1)).should(
                  'contain.text',
                  'You can prefill the amount, reference or both for users.'
                )
                cy.wrap($elements.eq(2)).should(
                  'contain.text',
                  'You can add metadata like cost centre codes or business area to your payment links.'
                )
              })

            cy.get('.govuk-button-group')
              .find('a')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link')
                cy.wrap($elements.eq(1)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link in Welsh')
              })

            cy.get('.govuk-summary-card')
              .should('have.length', 1)
              .find('.govuk-summary-card__actions')
              .should('exist')
              .find('a')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).contains('Edit') // todo navigate to the page once implemented
                cy.wrap($elements.eq(1)).contains('Delete') // todo navigate to the page once implemented
              })
          })
        })
      })
      describe('No payment links', () => {
        beforeEach(() => {
          setupStubs(USER_ROLE, SERVICE_MODE)
          cy.visit(PAYMENT_LINKS_URL(SERVICE_MODE), { failOnStatusCode: false })
        })

        it('live mode ui elements are present', () => {
          checkTitleAndHeading('Live payment links', SERVICE_NAME.en)
          cy.get('.service-pane').within(() => {
            cy.get('.govuk-accordion__section-toggle').click()
            cy.get('ol').find('li').should('have.length', 6)

            cy.get('h2')
              .should('have.length', 3)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Prefill payment link fields')
                cy.wrap($elements.eq(1)).should('contain.text', 'Add metadata for reconciliation and reporting')
                cy.wrap($elements.eq(2)).should('contain.text', 'See an example payment link')
              })

            cy.get('.govuk-inset-text').should('not.exist')

            cy.get('.govuk-warning-text').should('not.exist')

            cy.get('.govuk-body')
              .should('have.length', 10) // accordion paragraphs are visually hidden but still in the DOM
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should(
                  'contain.text',
                  'You can create payment links and send them to your users so they can pay you.'
                )
                cy.wrap($elements.eq(1)).should(
                  'contain.text',
                  'You can prefill the amount, reference or both for users.'
                )
                cy.wrap($elements.eq(2)).should(
                  'contain.text',
                  'You can add metadata like cost centre codes or business area to your payment links.'
                )
              })

            cy.get('.govuk-button-group')
              .find('a')
              .should('have.length', 2)
              .then(($elements) => {
                cy.wrap($elements.eq(0)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link')
                cy.wrap($elements.eq(1)).should('contain.text', 'Create a ' + SERVICE_MODE + ' payment link in Welsh')
              })

            cy.get('.govuk-summary-card').should('not.exist')
          })
        })
      })
    })
  })
})
