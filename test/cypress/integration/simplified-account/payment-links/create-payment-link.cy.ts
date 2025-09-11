import userStubs from '@test/cypress/stubs/user-stubs'
import ROLES from '@test/fixtures/roles.fixtures'
import gatewayAccountStubs from '@test/cypress/stubs/gateway-account-stubs'
import { SANDBOX } from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import {
  checkServiceNavigation,
} from '@test/cypress/integration/simplified-account/common/assertions'
import productStubs from '@test/cypress/stubs/products-stubs'
import tokenStubs from '@test/cypress/stubs/token-stubs'

const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 117
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}

const PAYMENT_LINKS_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links`

const CREATE_PAYMENT_LINK_URL = (serviceMode = 'test', isWelsh = false) => {
  const languageParam = isWelsh ? '?language=cy' : '';
  return `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/create${languageParam}`;
};

const CREATE_PAYMENT_LINK_REFERENCE_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/reference`

const CREATE_PAYMENT_LINK_AMOUNT_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/amount`

const CREATE_PAYMENT_LINK_REVIEW_URL = (serviceMode = 'test') =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/review`

const PAYMENT_LINK_REPORTING_COLUMNS_URL = (serviceMode = 'test', columnHeader: string) =>
  `/service/${SERVICE_EXTERNAL_ID}/account/${serviceMode}/payment-links/create/reporting-column/${columnHeader}`

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
    productStubs.postCreateProductSuccess({
      name: 'A submitted payment link'
    }),
    tokenStubs.postCreateTokenForAccountSuccess({ GATEWAY_ACCOUNT_ID })
  ])
}

describe('Create English payment link journey', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Non-admin view', () => {
    const USER_ROLE = 'view-only'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), { failOnStatusCode: false })
    })

    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('Admin view', () => {
    const USER_ROLE = 'admin'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), { failOnStatusCode: false })
    })

    it('should show the payment links navigation item in the side bar in an active state', () => {
      checkServiceNavigation('Payment links', PAYMENT_LINKS_URL('test'))
    })

    it('accessibility check', () => {
      cy.a11yCheck()
    })

    describe('payment link details page', () => {
      it('english only ui functions', () => {
        cy.get('h1').should('contain', 'Enter payment link details')
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')
        cy.get('.govuk-hint').should('contain.text', 'Good: Pay for your registration')
        cy.get('.govuk-hint').should('contain.text', 'Give your users more information.')
        cy.get('#service-content').find('.govuk-heading-s').should('contain.text', 'Example of what users will see')
        cy.get('#service-content').find('img')
          .should('have.attr', 'src')
          .should('include', 'start-page.svg')
      })

      it('should navigate to reference page', () => {
        cy.get('#service-content').find('form').find('#name')
          .click().focused()
          .type('A payment link name')
        cy.get('#service-content').find('form').find('button').click()

        cy.url().should('include', CREATE_PAYMENT_LINK_REFERENCE_URL(GatewayAccountType.TEST))
      })

      it('should validate form inputs', () => {
        cy.get('#service-content').find('form').find('#name').click().focused().clear()
        cy.get('#service-content').find('form').find('button').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter a title')
        cy.get('#service-content').find('form').find('#name').should('have.class', 'govuk-input--error')
      })
    })

    describe('payment link reference page', () => {
      beforeEach(() => {
        cy.createPaymentLinkWithTitle('A link with title', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST))
      })
      it('english only ui functions', () => {
        cy.get('h1').should('contain', 'Will your users already have a payment reference?')
        cy.get('#reference-type-custom').click()
        cy.get('#reference-label-hint').should('contain.text', 'For example, “invoice number”')
        cy.get('#reference-hint-hint').should('contain.text', 'Tell users what the payment reference looks like and where they can find it')
        cy.get('#service-content').find('.govuk-heading-s').should('contain.text', 'Example of what users will see')
        cy.get('#service-content')
          .find('img')
          .should('have.attr', 'src')
          .should('include', 'reference-page.svg')
      })

      it('should validate form inputs', () => {
        cy.get('#reference-type-custom').click()

        cy.get('#service-content').find('form').find('#reference-label').click().focused().clear()

        cy.get('#service-content').find('form').find('button').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Please enter a reference')
        cy.get('#service-content').find('form').find('#reference-label').should('have.class', 'govuk-input--error')
      })

      it('should navigate to amount page page', () => {
        cy.createPaymentLinkWithReference('A link with reference', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST))
        cy.url().should('include', CREATE_PAYMENT_LINK_AMOUNT_URL(GatewayAccountType.TEST))
      })
    })

    describe('payment link amount page', () => {
      beforeEach(() => {
        cy.createPaymentLinkWithReference('A link with different reference', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST))
      })

      it('english only ui functions', () => {
        cy.get('h1').should('contain', 'Is the payment for a fixed amount?')
        cy.get('#service-content')
          .find('img')
          .should('have.attr', 'src')
          .should('include', 'amount-and-confirm-page.svg')
      })

      it('should validate form inputs', () => {
        cy.get('#amount-type-fixed').click()
        cy.get('#service-content').find('form').find('#payment-amount').click().focused().clear()

        cy.get('#service-content').find('form').find('button').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter a payment amount')
        cy.get('#service-content').find('form').find('#payment-amount').should('have.class', 'govuk-input--error')
      })

      it('should navigate to review page', () => {
        cy.createPaymentLinkWithAmount('A link with amount', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST))
        cy.url().should('include', CREATE_PAYMENT_LINK_REVIEW_URL(GatewayAccountType.TEST))
      })
    })

    describe('payment link reporting columns page', () => {
      beforeEach(() => {
        cy.createPaymentLinkWithAmount('A link with different amount', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST))
        cy.get('.govuk-button--secondary').click()
      })
      it('english only ui functions', () => {
        cy.get('h1').should('contain', 'Reporting column')
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')
      })

      it('should validate form inputs', () => {
        cy.get('#service-content').find('form').find('#reporting-column').click().focused().clear()
        cy.get('#service-content').find('form').find('#cell-content').click().focused().clear()
        cy.get('#service-content').find('form').find('button').contains('Add reporting column').click()
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter the column header')
        cy.get('.govuk-error-summary').should('exist').should('contain.text', 'Enter the cell content')
        cy.get('#service-content').find('form').find('#reporting-column').should('have.class', 'govuk-input--error')
        cy.get('#service-content').find('form').find('#cell-content').should('have.class', 'govuk-input--error')
      })

      it('should navigate to review page and display the reporting column', () => {
        cy.createPaymentLinkWithMetadata('A link with metadata', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), 'invoice', '12345')
        cy.url().should('include', CREATE_PAYMENT_LINK_REVIEW_URL(GatewayAccountType.TEST))

        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(5).should('exist').within(() => {
          cy.get('.govuk-summary-list__key').should('contain', 'invoice')
          cy.get('.govuk-summary-list__value').should('contain', '12345')
          cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', PAYMENT_LINK_REPORTING_COLUMNS_URL(GatewayAccountType.TEST, 'invoice'))
        })
      })

      it('should navigate to review page and display the updated reporting column', () => {
        cy.createPaymentLinkWithMetadata('A link with metadata', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), 'invoice', '12345')
        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(5).should('exist').within(() => {
          cy.get('.govuk-summary-list__actions a').click()
        })
        cy.get('#service-content').find('form').find('#reporting-column').click().focused().clear().type('account')
        cy.get('#service-content').find('form').find('#cell-content').click().focused().clear().type('ABCDE')
        cy.get('#service-content').find('form').find('button').contains('Save changes').click()

        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(5).should('exist').within(() => {
          cy.get('.govuk-summary-list__key').should('contain', 'account')
          cy.get('.govuk-summary-list__value').should('contain', 'ABCDE')
          cy.get('.govuk-summary-list__actions a').should('have.attr', 'href', PAYMENT_LINK_REPORTING_COLUMNS_URL(GatewayAccountType.TEST, 'account'))
        })
      })

      it('should navigate to review page and not display the deleted reporting column', () => {
        cy.createPaymentLinkWithMetadata('A link with metadata', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), 'invoice', '12345')
        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(5).should('exist').within(() => {
          cy.get('.govuk-summary-list__actions a').click()
        })
        cy.get('#service-content').find('form').find('#reporting-column').click().focused().clear().type('account')
        cy.get('#service-content').find('form').find('#cell-content').click().focused().clear().type('ABCDE')
        cy.get('#service-content').find('form').find('button').contains('Delete reporting column').click()

        cy.get('.govuk-summary-list').find('.govuk-summary-list__row').eq(5).should('not.exist')
      })
    })

    describe('payment link review page', () => {
      beforeEach(() => {
        cy.createPaymentLinkWithMetadata('A link with different metadata', CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST), 'cost centre', '67890')
      })
      it('english only ui functions', () => {
        cy.get('h1').should('contain', 'Review your payment link details')
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link')
      })

      it('should navigate to the index page', () => {
        cy.get('#service-content').find('form').find('button').click()
        cy.url().should('include', PAYMENT_LINKS_URL(GatewayAccountType.TEST))
      })
    })
  })
})


describe('Create Welsh payment link journey', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Admin view', () => {
    const USER_ROLE = 'admin'
    beforeEach(() => {
      setupStubs(USER_ROLE)
      cy.visit(CREATE_PAYMENT_LINK_URL(GatewayAccountType.TEST, true), { failOnStatusCode: false })
    })

    describe('payment link details page', () => {

      it('welsh only ui functions', () => {
        cy.get('.govuk-caption-l').should('contain.text', 'Create test payment link (Welsh)')
        cy.get('.govuk-hint').should('contain.text', 'Talu am drwydded barcio')
        cy.get('.govuk-hint').should('contain.text', 'Give your users more information in Welsh.')
        cy.get('#service-content').find('.govuk-heading-s').should('not.exist')
      })
    })
  })
})

