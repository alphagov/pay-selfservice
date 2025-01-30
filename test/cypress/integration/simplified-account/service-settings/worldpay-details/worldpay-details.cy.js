const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const { WORLDPAY, SANDBOX } = require('@models/payment-providers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'
const CREDENTIAL_EXTERNAL_ID = 'worldpay-credentials-xyz'

const VALID_MOTO_MERCHANT_CODE = 'AVALIDMERCHANTCODEMOTO'
const VALID_WORLDPAY_USERNAME = 'worldpay-user'
const VALID_WORLDPAY_PASSWORD = 'worldpay-password' // pragma: allowlist secret
const VALID_WORLDPAY_USERNAME_2 = 'worldpay-user-2'
const VALID_WORLDPAY_PASSWORD_2 = 'worldpay-password-2' // pragma: allowlist secret

const setupStubs = (opts = {}, additionalStubs = []) => {
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
        credentials: options.credentials,
        external_id: CREDENTIAL_EXTERNAL_ID
      }],
      allow_moto: true
    }),
    gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }),
    gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      merchant_code: VALID_MOTO_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME_2,
      password: VALID_WORLDPAY_PASSWORD_2
    }),
    gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, {
      path: 'credentials/worldpay/one_off_customer_initiated',
      value: {
        merchant_code: VALID_MOTO_MERCHANT_CODE,
        username: VALID_WORLDPAY_USERNAME,
        password: VALID_WORLDPAY_PASSWORD
      },
      userExternalId: USER_EXTERNAL_ID
    }),
    gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, {
      path: 'credentials/worldpay/one_off_customer_initiated',
      value: {
        merchant_code: VALID_MOTO_MERCHANT_CODE,
        username: VALID_WORLDPAY_USERNAME_2,
        password: VALID_WORLDPAY_PASSWORD_2
      },
      userExternalId: USER_EXTERNAL_ID
    }),
    ...additionalStubs
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
          cy.title().should('eq', 'Worldpay details - Settings - My cool service - GOV.UK Pay')
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
          cy.title().should('eq', 'Worldpay details - Settings - My cool service - GOV.UK Pay')
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
          paymentProvider: SANDBOX
        })
      })

      it('should return a 404', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(404))
      })

      it('should not show the Worldpay details link in the settings nav', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings`)

        cy.get('.service-settings-nav')
          .find('li')
          .should('not.contain', 'Worldpay details')
      })
    })
  })

  describe('Edit one-off-customer-initiated credentials', () => {
    describe('for an admin user', () => {
      describe('page layout', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('h1').should('contain', 'Your Worldpay credentials')
          cy.title().should('eq', 'Your Worldpay credentials - Settings - My cool service - GOV.UK Pay')
        })

        it('should show worldpay settings in the settings navigation', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('.service-settings-nav')
            .find('li')
            .contains('Worldpay details')
            .then(li => {
              cy.wrap(li)
                .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
                .parent().should('have.class', 'service-settings-nav__li--active')
            })
        })
      })

      describe('when there are validation errors', () => {
        it('should return to the edit credentials page and show the validation errors', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#merchant-code').type('this-is-not-a-valid-merchant-code')

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain.text', 'Enter a MOTO merchant code. MOTO payments are enabled for this account')
            .should('contain', 'Enter your username')
            .should('contain', 'Enter your password')

          cy.get('#merchant-code-error').should('contain.text', 'Enter a MOTO merchant code. MOTO payments are enabled for this account')
          cy.get('#username-error').should('contain.text', 'Enter your username')
          cy.get('#password-error').should('contain.text', 'Enter your password')
        })
      })

      describe('when credentials have not been set', () => {
        it('should show the empty credentials form', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#merchant-code').should('have.value', '')
          cy.get('input#username').should('have.value', '')
          cy.get('input#password').should('have.value', '')
        })

        it('should redirect to the worldpay details landing page on valid form submission', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#merchant-code').type(VALID_MOTO_MERCHANT_CODE)
          cy.get('input#username').type(VALID_WORLDPAY_USERNAME)
          cy.get('input#password').type(VALID_WORLDPAY_PASSWORD)

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
        })

        it('should show a success banner on the landing page if this is the final task to complete', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#merchant-code').clear().type(VALID_MOTO_MERCHANT_CODE)
          cy.get('input#username').clear().type(VALID_WORLDPAY_USERNAME)
          cy.get('input#password').clear().type(VALID_WORLDPAY_PASSWORD)

          cy.task('clearStubs')
          const accountStubWithCredentials = gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
            gateway_account_id: GATEWAY_ACCOUNT_ID,
            payment_provider: 'worldpay',
            gateway_account_credentials: [{
              payment_provider: 'worldpay',
              credentials: {
                one_off_customer_initiated: {
                  merchant_code: VALID_MOTO_MERCHANT_CODE,
                  username: VALID_WORLDPAY_USERNAME,
                  password: VALID_WORLDPAY_PASSWORD
                }
              },
              external_id: CREDENTIAL_EXTERNAL_ID
            }],
            allow_moto: true
          })

          setupStubs({}, [accountStubWithCredentials])

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages')
            .should('exist')
            .should('contain.text', 'Service connected to Worldpay')
            .should('contain.text', 'This service can now take payments')
        })

        it('should not show a success banner if other tasks are outstanding', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#merchant-code').clear().type(VALID_MOTO_MERCHANT_CODE)
          cy.get('input#username').clear().type(VALID_WORLDPAY_USERNAME)
          cy.get('input#password').clear().type(VALID_WORLDPAY_PASSWORD)

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages')
            .should('not.exist')
        })
      })

      describe('when credentials have been set', () => {
        it('should populate the merchant code and username fields with the credentials', () => {
          setupStubs({
            credentials: {
              one_off_customer_initiated: {
                merchant_code: VALID_MOTO_MERCHANT_CODE,
                username: VALID_WORLDPAY_USERNAME
              }
            }
          })

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

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
                password: VALID_WORLDPAY_PASSWORD
              }
            }
          })

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#password').should('have.value', '')
        })

        it('should not show a success banner when submitting updated credentials', () => {
          setupStubs({
            credentials: {
              one_off_customer_initiated: {
                merchant_code: VALID_MOTO_MERCHANT_CODE,
                username: VALID_WORLDPAY_USERNAME
              }
            }
          })

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`)

          cy.get('input#merchant-code').clear().type(VALID_MOTO_MERCHANT_CODE)
          cy.get('input#username').clear().type(VALID_WORLDPAY_USERNAME_2)
          cy.get('input#password').clear().type(VALID_WORLDPAY_PASSWORD_2)

          cy.task('clearStubs')
          const accountStubWithOldCredentials = gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
            gateway_account_id: GATEWAY_ACCOUNT_ID,
            payment_provider: 'worldpay',
            gateway_account_credentials: [{
              payment_provider: 'worldpay',
              credentials: {
                one_off_customer_initiated: {
                  merchant_code: VALID_MOTO_MERCHANT_CODE,
                  username: VALID_WORLDPAY_USERNAME,
                  password: VALID_WORLDPAY_PASSWORD
                }
              },
              external_id: CREDENTIAL_EXTERNAL_ID
            }],
            allow_moto: true
          })
          const accountStubWithNewCredentials = gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
            gateway_account_id: GATEWAY_ACCOUNT_ID,
            payment_provider: 'worldpay',
            gateway_account_credentials: [{
              payment_provider: 'worldpay',
              credentials: {
                one_off_customer_initiated: {
                  merchant_code: VALID_MOTO_MERCHANT_CODE,
                  username: VALID_WORLDPAY_USERNAME_2,
                  password: VALID_WORLDPAY_PASSWORD_2
                }
              },
              external_id: CREDENTIAL_EXTERNAL_ID
            }],
            allow_moto: true
          })
          setupStubs({
            credentials: {
              one_off_customer_initiated: {
                merchant_code: VALID_MOTO_MERCHANT_CODE,
                username: VALID_WORLDPAY_USERNAME,
                password: VALID_WORLDPAY_PASSWORD
              }
            }
          }, [accountStubWithOldCredentials, accountStubWithNewCredentials])

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

          cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages').should('not.exist')
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
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(403))
      })
    })

    describe('for a non-Worldpay account', () => {
      beforeEach(() => {
        setupStubs({
          role: 'view-and-refund',
          paymentProvider: SANDBOX
        })
      })

      it('should return a 404', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(404))
      })
    })
  })
})
