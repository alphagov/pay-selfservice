const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const productsStubs = require('@test/cypress/stubs/products-stubs')
const stripeAccountSetupStubs = require('@test/cypress/stubs/stripe-account-setup-stub')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_EXTERNAL_ID = 'gatewayaccount789ghi'
const GATEWAY_ACCOUNT_ID = 11

const setupStubs = (options = {}) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role || 'admin'],
    }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      gatewayAccountExternalId: GATEWAY_ACCOUNT_EXTERNAL_ID,
      paymentProvider: options.paymentProvider || 'sandbox',
      type: options.type || 'test',
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, options.type || 'test', {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: GATEWAY_ACCOUNT_EXTERNAL_ID,
      payment_provider: options.paymentProvider || 'sandbox',
      type: options.type || 'test',
    }),
    stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      responsiblePerson: false,
      bankAccount: false,
      vatNumber: false,
      companyNumber: false,
    }),
    productsStubs.getProductsByGatewayAccountIdAndTypeStub(
      options.prototypeLinks || [],
      GATEWAY_ACCOUNT_ID,
      'PROTOTYPE'
    ),
    productsStubs.disableProductStub(GATEWAY_ACCOUNT_ID, 'product123abc'),
  ])
}

describe('prototype links page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('page access constraints', () => {
    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-only',
        })
      })

      it('should be possible to access the prototype links page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Prototype links').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)
      })
    })

    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
        })
      })

      it('should be possible to access the prototype links page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Prototype links').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)
      })
    })

    describe('for a stripe test account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'stripe',
          type: 'test',
        })
      })

      it('should be possible to access the prototype links page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Prototype links').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)
      })
    })

    describe('for a sandbox test account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'sandbox',
          type: 'test',
        })
      })

      it('should be possible to access the prototype links page', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users`)
        cy.contains('a', 'Prototype links').should('exist').click()
        cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)
      })
    })

    describe('for a live account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'stripe',
          type: 'live',
        })
      })

      it('should not be possible to access the prototype links page', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/live/test-with-your-users/links`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })

    describe('for a worldpay test account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'admin',
          paymentProvider: 'worldpay',
          type: 'test',
        })
      })

      it('should not be possible to access the prototype links page', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })
  })

  describe('when there are existing prototype links', () => {
    beforeEach(() => {
      setupStubs({
        prototypeLinks: [
          {
            type: 'PROTOTYPE',
            external_id: 'product123abc',
            name: 'Test prototype 1',
            price: 1000,
            return_url: 'https://www.gov.uk',
          },
          {
            type: 'PROTOTYPE',
            external_id: 'product456def',
            name: 'Test prototype 2',
            price: 2000,
            return_url: 'https://www.gov.uk',
          },
        ],
      })
    })

    it('should show the list of prototype links with visually hidden text', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)

      cy.get('#prototyping__links-header').should('contain.text', 'There are 2 prototype links')

      cy.get('.key-list').within(() => {
        cy.get('.key-list-item')
          .eq(0)
          .within(() => {
            cy.get('h3>a')
              .should('contain.text', 'http://products-ui.url/pay/product123abc')
              .should('have.attr', 'href', 'http://products-ui.url/pay/product123abc')

            cy.get('dl').eq(0).contains('Payment description: Test prototype 1')
            cy.get('dl').eq(1).contains('Payment amount: £10.00')
            cy.get('dl').eq(2).contains('Success page: https://www.gov.uk')

            cy.contains('a', 'Delete prototype link')
            cy.contains('span', 'for product123abc')

              .should('have.attr', 'href', 'links/disable/product123abc')
          })

        cy.get('.key-list-item')
          .eq(1)
          .within(() => {
            cy.get('h3>a')
              .should('contain.text', 'http://products-ui.url/pay/product456def')
              .should('have.attr', 'href', 'http://products-ui.url/pay/product456def')

            cy.get('dl').eq(0).contains('Payment description: Test prototype 2')
            cy.get('dl').eq(1).contains('Payment amount: £20.00')
            cy.get('dl').eq(2).contains('Success page: https://www.gov.uk')

            cy.contains('a', 'Delete prototype link').should('have.attr', 'href', 'links/disable/product456def')
            cy.contains('span', 'for product456def')
          })
      })
    })

    it('should allow disabling a prototype link', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)

      cy.get('.key-list').within(() => {
        cy.get('.key-list-item')
          .eq(0)
          .within(() => {
            cy.contains('a', 'Delete prototype link').click()
          })
      })

      cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)

      cy.get('.govuk-notification-banner').should('contain.text', 'Prototype link deleted')
    })
  })

  describe('when there are no existing prototype links', () => {
    beforeEach(() => {
      setupStubs({
        prototypeLinks: [],
      })
    })

    it('should show there are no prototype links', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/test/test-with-your-users/links`)

      cy.get('#prototyping__links-header').should('contain.text', 'There are no prototype links')
    })
  })
})
