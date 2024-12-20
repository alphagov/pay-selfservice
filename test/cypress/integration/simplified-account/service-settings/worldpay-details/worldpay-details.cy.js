const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const { WORLDPAY, STRIPE } = require('@models/payment-providers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'

const VALID_MOTO_MERCHANT_CODE = 'AVALIDMERCHANTCODEMOTO'
const VALID_WORLDPAY_USERNAME = 'worldpay-user'

const setupStubs = (opts = {}) => {
  const options = Object.assign({}, {
    role: 'admin',
    paymentProvider: WORLDPAY,
    credentials: {}
  }, opts)

  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: options.paymentProvider,
      gateway_account_credentials: [{
        payment_provider: options.paymentProvider,
        credentials: options.credentials
      }],
      allow_moto: true
    })
  ])
}

describe('Worldpay details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Worldpay details landing page', () => {
    describe('for an admin user', () => {
      describe('when some tasks are incomplete', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('h1').should('contain', 'Worldpay details')
          cy.title().should('eq', 'Settings - Worldpay details - GOV.UK Pay')
        })

        it('should show worldpay settings in the settings navigation', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.service-settings-nav')
            .find('li')
            .contains('Worldpay details')
            .then(li => {
              cy.wrap(li)
                .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
                .parent().should('have.class', 'service-settings-nav__li--active')
            })
        })

        it('should show the list of tasks', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-task-list').within(() => {
            cy.get('.govuk-task-list__item').eq(0).within(() => {
              cy.get('a')
                .should('contain.text', 'Link your Worldpay account with GOV.UK Pay')
                .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)
              cy.get('.govuk-task-list__status').within(() => {
                cy.get('strong.govuk-tag.govuk-tag--blue').should('contain.text', 'Not yet started')
              })
            })
          })
        })
      })

      describe('when all tasks are completed', () => {
        beforeEach(() => {
          setupStubs({
            credentials: {
              one_off_customer_initiated: { merchant_code: VALID_MOTO_MERCHANT_CODE, username: VALID_WORLDPAY_USERNAME }
            }
          })
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('h1').should('contain', 'Worldpay details')
          cy.title().should('eq', 'Settings - Worldpay details - GOV.UK Pay')
        })

        it('should show the completed task cards', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-summary-card').eq(0).within(() => {
            cy.get('.govuk-summary-card__title-wrapper > h2').should('contain', 'Account credentials')

            cy.get('.govuk-summary-list__row').eq(0).within(() => {
              cy.get('dt').should('contain.text', 'Merchant code')
              cy.get('dd').should('contain.text', VALID_MOTO_MERCHANT_CODE)
            })

            cy.get('.govuk-summary-list__row').eq(1).within(() => {
              cy.get('dt').should('contain.text', 'Username')
              cy.get('dd').should('contain.text', VALID_WORLDPAY_USERNAME)
            })

            cy.get('.govuk-summary-list__row').eq(2).within(() => {
              cy.get('dt').should('contain.text', 'Password')
              cy.get('dd').should('contain.text', '●●●●●●●●')
            })
          })
        })

        it('should show links to edit the details', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-summary-card').within(() => {
            cy.get('.govuk-summary-card__actions > a.govuk-link').should('contain', 'Change')
              .should('have.attr', 'href',
                `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)
          })
        })

        it('should only show redacted passwords in task cards', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-summary-card')
            .each(card => {
              cy.wrap(card).get('.govuk-summary-list__row').filter(':contains("Password")').within(() => {
                cy.get('dd').should('contain.text', '●●●●●●●●')
              })
            })
        })
      })
    })

    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund'
        })
      })

      it('should return a 403', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(403))
      })
    })

    describe('for a non-Worldpay account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund',
          paymentProvider: STRIPE
        })
      })

      it('should return a 404', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(404))
      })
    })
  })
})
