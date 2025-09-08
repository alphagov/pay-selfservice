import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { checkServiceNavigation } from '@test/cypress/integration/simplified-account/common/assertions'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

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

  describe('Admin view', () => {
    const USER_ROLE = 'admin'
    describe('English payment link', () => {
      beforeEach(() => {
        setupStubs(USER_ROLE)
        cy.visit(CREATE_PAYMENT_LINK_AMOUNT_URL(GatewayAccountType.TEST), { failOnStatusCode: false })
      })

      it('should show the payment links navigation item in the side bar in an active state', () => {
        checkServiceNavigation('Payment links', CREATE_PAYMENT_LINK_AMOUNT_URL('test'))
      })

      it('accessibility check', () => {
        cy.a11yCheck({
          exclude: ['.govuk-skip-link', '.govuk-radios__input'] // https://accessibility.blog.gov.uk/2021/09/21/an-update-on-the-accessibility-of-conditionally-revealed-questions/
        })
      })

      it('english only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')
        cy.get('#amount-type-variable').click()
        cy.get('#amount-hint-hint').should('contain.text', 'Tell users how to work out how much they should pay')
        cy.get('#service-content').find('.govuk-heading-s').should('contain.text', 'Example of what users will see')
        cy.get('#service-content')
          .find('img')
          .should('have.attr', 'src')
          .should('include', 'amount-and-confirm-page.svg')
      })
    })


    // describe('Welsh payment link', () => {
    //   beforeEach(() => {
    //     setupStubs(USER_ROLE, GatewayAccountType.LIVE, WELSH_PAYMENT_LINK)
    //     cy.visit(EDIT_PAYMENT_LINK_AMOUNT_URL(GatewayAccountType.LIVE, WELSH_PAYMENT_LINK), { failOnStatusCode: false })
    //   })

    //   it('should show the payment links navigation item in the side bar in an active state', () => {
    //     checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('live'))
    //   })

    //   it('accessibility check', () => {
    //     cy.a11yCheck({
    //       exclude: ['.govuk-skip-link', '.govuk-radios__input'] // https://accessibility.blog.gov.uk/2021/09/21/an-update-on-the-accessibility-of-conditionally-revealed-questions/
    //     })
    //   })

    //   it('welsh only ui functions', () => {
    //     cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link (Welsh)')
    //     cy.get('#amount-type-variable').click()
    //     cy.get('#amount-hint-hint').should(
    //       'contain.text',
    //       'Explain in Welsh how users can work out how much they should pay'
    //     )
    //     cy.get('#service-content').find('.govuk-heading-s').should('not.exist')
    //     cy.get('#service-content').find('img').should('not.exist')
    //   })
    // })


    describe('Page content', () => {

      beforeEach(() => {
        setupStubs(USER_ROLE)
        cy.visit(CREATE_PAYMENT_LINK_AMOUNT_URL(GatewayAccountType.TEST), { failOnStatusCode: false })
      })

      it('should navigate back to reference view when back link is clicked', () => {
        cy.get('.service-pane').find('.govuk-back-link').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Will your users already have a payment reference?')
      })

      it('should validate form inputs', () => {
        cy.get('#service-content').find('form').find('#payment-amount').click().focused().clear()

        cy.get('#service-content').find('form').find('button').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter a payment amount')
        cy.get('#service-content').find('form').find('#payment-amount').should('have.class', 'govuk-input--error')
      })

      it('should update payment link information', () => {
        cy.get('#service-content').find('form').find('#payment-amount').click().focused().clear().type('9999')
        cy.get('#service-content').find('form').find('button').click()
        cy.get('#service-content').find('h1').should('contain.text', 'Review your payment link details')
      })
    })
  })
})

