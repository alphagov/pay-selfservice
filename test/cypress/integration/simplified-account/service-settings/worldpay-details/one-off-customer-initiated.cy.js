const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { SANDBOX, WORLDPAY } = require('@models/constants/payment-providers')
const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'
const CREDENTIAL_EXTERNAL_ID = 'worldpay-credentials-xyz'

const VALID_MOTO_MERCHANT_CODE = 'AVALIDMERCHANTCODEMOTO'
const VALID_WORLDPAY_USERNAME = 'worldpay-user'
const VALID_WORLDPAY_PASSWORD = 'worldpay-password' // pragma: allowlist secret
const VALID_WORLDPAY_USERNAME_2 = 'worldpay-user-2'
const VALID_WORLDPAY_PASSWORD_2 = 'worldpay-password-2' // pragma: allowlist secret

const setupStubs = (opts = {}, additionalStubs = []) => {
  const options = Object.assign(
    {},
    {
      role: 'admin',
      paymentProvider: WORLDPAY,
      credentials: {},
    },
    opts
  )

  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role],
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: options.paymentProvider,
      gateway_account_credentials: [
        {
          payment_provider: options.paymentProvider,
          credentials: options.credentials,
          external_id: CREDENTIAL_EXTERNAL_ID,
        },
      ],
      allow_moto: true,
      service_id: SERVICE_EXTERNAL_ID,
    }),
    gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD,
    }),
    gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME_2,
      password: VALID_WORLDPAY_PASSWORD_2,
    }),
    gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
      SERVICE_EXTERNAL_ID,
      ACCOUNT_TYPE,
      CREDENTIAL_EXTERNAL_ID,
      {
        path: 'credentials/worldpay/one_off_customer_initiated',
        value: {
          merchant_code: VALID_MOTO_MERCHANT_CODE,
          username: VALID_WORLDPAY_USERNAME,
          password: VALID_WORLDPAY_PASSWORD,
        },
        userExternalId: USER_EXTERNAL_ID,
      }
    ),
    gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
      SERVICE_EXTERNAL_ID,
      ACCOUNT_TYPE,
      CREDENTIAL_EXTERNAL_ID,
      {
        path: 'credentials/worldpay/one_off_customer_initiated',
        value: {
          merchant_code: VALID_MOTO_MERCHANT_CODE,
          username: VALID_WORLDPAY_USERNAME_2,
          password: VALID_WORLDPAY_PASSWORD_2,
        },
        userExternalId: USER_EXTERNAL_ID,
      }
    ),
    ...additionalStubs,
  ])
}

describe('Worldpay details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('Edit one-off-customer-initiated credentials', () => {
    describe('for an admin user', () => {
      describe('page layout', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should show the correct heading and title', () => {
          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('h1').should('contain', 'Your Worldpay credentials')
          cy.title().should('eq', 'Your Worldpay credentials - Settings - My cool service - GOV.UK Pay')
        })

        it('should show worldpay settings in the settings navigation', () => {
          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          checkSettingsNavigation(
            'Worldpay details',
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`
          )
        })
      })

      describe('when there are validation errors', () => {
        it('should return to the edit credentials page and show the validation errors', () => {
          setupStubs()

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').type('this-is-not-a-valid-merchant-code', { delay: 0 })

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should(
            'eq',
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain.text', 'Enter a MOTO merchant code. MOTO payments are enabled for this account')
            .should('contain', 'Enter your username')
            .should('contain', 'Enter your password')

          cy.get('#merchant-code-error').should(
            'contain.text',
            'Enter a MOTO merchant code. MOTO payments are enabled for this account'
          )
          cy.get('#username-error').should('contain.text', 'Enter your username')
          cy.get('#password-error').should('contain.text', 'Enter your password')
        })
      })

      describe('when credentials have not been set', () => {
        it('should show the empty credentials form', () => {
          setupStubs()

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').should('have.value', '')
          cy.get('input#username').should('have.value', '')
          cy.get('input#password').should('have.value', '')
        })

        it('should redirect to the worldpay details landing page on valid form submission', () => {
          setupStubs()

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').type(VALID_MOTO_MERCHANT_CODE, { delay: 0 })
          cy.get('input#username').type(VALID_WORLDPAY_USERNAME, { delay: 0 })
          cy.get('input#password').type(VALID_WORLDPAY_PASSWORD, { delay: 0 })

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should(
            'eq',
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`
          )
        })

        it('should show a success banner on the landing page if this is the final task to complete', () => {
          setupStubs()

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').clear().type(VALID_MOTO_MERCHANT_CODE, { delay: 0 })
          cy.get('input#username').clear().type(VALID_WORLDPAY_USERNAME, { delay: 0 })
          cy.get('input#password').clear().type(VALID_WORLDPAY_PASSWORD, { delay: 0 })

          cy.task('clearStubs')
          const accountStubWithCredentials = gatewayAccountStubs.getAccountByServiceIdAndAccountType(
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE,
            {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              payment_provider: 'worldpay',
              gateway_account_credentials: [
                {
                  payment_provider: 'worldpay',
                  credentials: {
                    one_off_customer_initiated: {
                      merchant_code: VALID_MOTO_MERCHANT_CODE,
                      username: VALID_WORLDPAY_USERNAME,
                      password: VALID_WORLDPAY_PASSWORD,
                    },
                  },
                  external_id: CREDENTIAL_EXTERNAL_ID,
                },
              ],
              allow_moto: true,
            }
          )

          setupStubs({}, [accountStubWithCredentials])

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should(
            'eq',
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`
          )

          cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages')
            .should('exist')
            .should('contain.text', 'Service connected to Worldpay')
            .should('contain.text', 'This service can now take payments')
        })

        it('should not show a success banner if other tasks are outstanding', () => {
          setupStubs()

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').clear().type(VALID_MOTO_MERCHANT_CODE, { delay: 0 })
          cy.get('input#username').clear().type(VALID_WORLDPAY_USERNAME, { delay: 0 })
          cy.get('input#password').clear().type(VALID_WORLDPAY_PASSWORD, { delay: 0 })

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should(
            'eq',
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`
          )

          cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages').should('not.exist')
        })
      })

      describe('when credentials have been set', () => {
        it('should populate the merchant code and username fields with the credentials', () => {
          setupStubs({
            credentials: {
              one_off_customer_initiated: {
                merchant_code: VALID_MOTO_MERCHANT_CODE,
                username: VALID_WORLDPAY_USERNAME,
              },
            },
          })

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').should('have.value', VALID_MOTO_MERCHANT_CODE)
          cy.get('input#username').should('have.value', VALID_WORLDPAY_USERNAME)
        })

        // the password should not be returned by connector
        // but this tests that even if it is, it will not be displayed
        it('should not populate the password field', () => {
          setupStubs({
            credentials: {
              one_off_customer_initiated: {
                merchant_code: VALID_MOTO_MERCHANT_CODE,
                username: VALID_WORLDPAY_USERNAME,
                password: VALID_WORLDPAY_PASSWORD,
              },
            },
          })

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#password').should('have.value', '')
        })

        it('should not show a success banner when submitting updated credentials', () => {
          setupStubs({
            credentials: {
              one_off_customer_initiated: {
                merchant_code: VALID_MOTO_MERCHANT_CODE,
                username: VALID_WORLDPAY_USERNAME,
              },
            },
          })

          cy.visit(
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`
          )

          cy.get('input#merchant-code').clear().type(VALID_MOTO_MERCHANT_CODE, { delay: 0 })
          cy.get('input#username').clear().type(VALID_WORLDPAY_USERNAME_2, { delay: 0 })
          cy.get('input#password').clear().type(VALID_WORLDPAY_PASSWORD_2, { delay: 0 })

          cy.task('clearStubs')
          const accountStubWithOldCredentials = gatewayAccountStubs.getAccountByServiceIdAndAccountType(
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE,
            {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              payment_provider: 'worldpay',
              gateway_account_credentials: [
                {
                  payment_provider: 'worldpay',
                  credentials: {
                    one_off_customer_initiated: {
                      merchant_code: VALID_MOTO_MERCHANT_CODE,
                      username: VALID_WORLDPAY_USERNAME,
                      password: VALID_WORLDPAY_PASSWORD,
                    },
                  },
                  external_id: CREDENTIAL_EXTERNAL_ID,
                },
              ],
              allow_moto: true,
            }
          )
          const accountStubWithNewCredentials = gatewayAccountStubs.getAccountByServiceIdAndAccountType(
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE,
            {
              gateway_account_id: GATEWAY_ACCOUNT_ID,
              payment_provider: 'worldpay',
              gateway_account_credentials: [
                {
                  payment_provider: 'worldpay',
                  credentials: {
                    one_off_customer_initiated: {
                      merchant_code: VALID_MOTO_MERCHANT_CODE,
                      username: VALID_WORLDPAY_USERNAME_2,
                      password: VALID_WORLDPAY_PASSWORD_2,
                    },
                  },
                  external_id: CREDENTIAL_EXTERNAL_ID,
                },
              ],
              allow_moto: true,
            }
          )
          setupStubs(
            {
              credentials: {
                one_off_customer_initiated: {
                  merchant_code: VALID_MOTO_MERCHANT_CODE,
                  username: VALID_WORLDPAY_USERNAME,
                  password: VALID_WORLDPAY_PASSWORD,
                },
              },
            },
            [accountStubWithOldCredentials, accountStubWithNewCredentials]
          )

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should(
            'eq',
            `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`
          )

          cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages').should('not.exist')
        })
      })
    })

    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund',
        })
      })

      it('should return a 403', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(403))
      })
    })

    describe('for a non-Worldpay account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund',
          paymentProvider: SANDBOX,
        })
      })

      it('should return a 404', () => {
        cy.request({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`,
          failOnStatusCode: false,
        }).then((response) => expect(response.status).to.eq(404))
      })
    })
  })
})
