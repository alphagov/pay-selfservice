const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { SANDBOX, WORLDPAY } = require('@models/constants/payment-providers')
const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'
const CREDENTIAL_EXTERNAL_ID = 'worldpay-credentials-xyz'

const VALID_WORLDPAY_MERCHANT_CODE = 'AVALIDMERCHANTCODE'
const VALID_WORLDPAY_USERNAME = 'worldpay-user'
const VALID_WORLDPAY_PASSWORD = 'worldpay-password' // pragma: allowlist secret

const VALID_ORGANISATIONAL_UNIT_ID = '5bd9b55e4444761ac0af1c80' // pragma: allowlist secret
const VALID_ISSUER = '5bd9e0e4444dce15fed8c940' // pragma: allowlist secret
const VALID_JWT_MAC_KEY = 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0' // pragma: allowlist secret
const INVALID_JWT_MAC_KEY = 'a12399ce-8d78-4910-a5b6-dc7de0f7b6e6' // pragma: allowlist secret

const setupStubs = (opts = {}, additionalStubs = []) => {
  const options = Object.assign({}, {
    role: 'admin',
    paymentProvider: WORLDPAY,
    credentials: {
      one_off_customer_initiated: {
        merchant_code: VALID_WORLDPAY_MERCHANT_CODE,
        username: VALID_WORLDPAY_USERNAME
      }
    },
    worldpay3dsFlex: undefined
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
      worldpay_3ds_flex: options.worldpay3dsFlex,
      allow_moto: false
    }),
    gatewayAccountStubs.postCheckWorldpay3dsFlexByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      organisational_unit_id: VALID_ORGANISATIONAL_UNIT_ID,
      issuer: VALID_ISSUER,
      jwt_mac_key: VALID_JWT_MAC_KEY
    }),
    gatewayAccountStubs.postCheckWorldpay3dsFlexByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      organisational_unit_id: VALID_ORGANISATIONAL_UNIT_ID,
      issuer: VALID_ISSUER,
      jwt_mac_key: INVALID_JWT_MAC_KEY
    }, 'invalid'),
    gatewayAccountStubs.putWorldpay3dsFlexByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      organisational_unit_id: VALID_ORGANISATIONAL_UNIT_ID,
      issuer: VALID_ISSUER,
      jwt_mac_key: VALID_JWT_MAC_KEY
    }),
    gatewayAccountStubs.patchUpdate3dsVersionByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 2),
    ...additionalStubs
  ])
}

describe('Worldpay details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('Worldpay 3DS Flex Credentials task', () => {
    describe('for an admin user', () => {
      describe('the page layout', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('h1').should('contain', 'Your Worldpay 3DS Flex credentials')
          cy.title().should('eq', 'Your Worldpay 3DS Flex credentials - Settings - My cool service - GOV.UK Pay')
        })

        it('should show worldpay settings in the settings navigation', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('.service-settings-nav')
            .find('li')
            .contains('Worldpay details')
            .then(li => {
              cy.wrap(li)
                .should('have.attr', 'href', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
                .parent().should('have.class', 'service-settings-nav__li--active')
            })
        })

        it('should show the form correctly', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('#flex-credentials-form')
            .within(() => {
              cy.get('.govuk-form-group').eq(0).within(() => {
                cy.get('.govuk-label').should('contain.text', 'Organisational Unit ID')
                cy.get('.govuk-hint').should('contain.text', 'Provided to you by Worldpay. For example, ‘5bd9b55e4444761ac0af1c80’.')
                cy.get('.govuk-input')
                  .should('exist')
                  .should('have.attr', 'name', 'organisationalUnitId')
              })

              cy.get('.govuk-form-group').eq(1).within(() => {
                cy.get('.govuk-label').should('contain.text', 'Issuer (API ID)')
                cy.get('.govuk-hint').should('contain.text', 'Provided to you by Worldpay. For example, ‘5bd9e0e4444dce15fed8c940’.')
                cy.get('.govuk-input')
                  .should('exist')
                  .should('have.attr', 'name', 'issuer')
              })

              cy.get('.govuk-form-group').eq(2).within(() => {
                cy.get('.govuk-label').should('contain.text', 'JWT MAC key (API key)')
                cy.get('.govuk-hint').should('contain.text', 'Provided to you by Worldpay. For example, ‘fa2daee2-1fbb-45ff-4444-52805d5cd9e0’.')
                cy.get('.govuk-input')
                  .should('exist')
                  .should('have.attr', 'name', 'jwtMacKey')
              })
            })
        })
      })

      describe('when there are validation errors', () => {
        it('should return to the edit flex credentials page and show the validation errors', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('input#organisational-unit-id').type('this-is-not-a-valid-organisational-unit-id', { delay: 0 })

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain.text', 'Enter your organisational unit ID in the format you received it')
            .should('contain', 'Enter your issuer')
            .should('contain', 'Enter your JWT MAC key')

          cy.get('#organisational-unit-id-error').should('contain.text', 'Enter your organisational unit ID in the format you received it')
          cy.get('#issuer-error').should('contain.text', 'Enter your issuer')
          cy.get('#jwt-mac-key-error').should('contain.text', 'Enter your JWT MAC key')
        })
      })

      describe('when the entered credentials fail validation with worldpay', () => {
        it('should return to the edit flex credentials page and show a validation error', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('input#organisational-unit-id').type(VALID_ORGANISATIONAL_UNIT_ID, { delay: 0 })
          cy.get('input#issuer').type(VALID_ISSUER, { delay: 0 })
          cy.get('input#jwt-mac-key').type(INVALID_JWT_MAC_KEY, { delay: 0 })

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain.text', 'Check your 3DS credentials, failed to link your account to Worldpay with credentials provided')
        })
      })

      describe('when credentials have not been set', () => {
        it('should display an empty credentials form', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('input#organisational-unit-id').should('have.value', '')
          cy.get('input#issuer').should('have.value', '')
          cy.get('input#jwt-mac-key').should('have.value', '')
        })
      })

      describe('when credentials have been set', () => {
        beforeEach(() => {
          setupStubs({
            worldpay3dsFlex: {
              organisational_unit_id: VALID_ORGANISATIONAL_UNIT_ID,
              issuer: VALID_ISSUER,
              jwt_mac_key: VALID_JWT_MAC_KEY
            }
          })
        })
        it('should display the credentials form with Organisational Unit ID and Issuer populated', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

          cy.get('input#organisational-unit-id').should('have.value', '5bd9b55e4444761ac0af1c80') // pragma: allowlist secret
          cy.get('input#issuer').should('have.value', '5bd9e0e4444dce15fed8c940') // pragma: allowlist secret
        })

        it('should not populate the JWT MAC Key field', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)
          cy.get('input#jwt-mac-key').should('have.value', '')
        })
      })

      describe('when entering valid credentials', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should redirect to the index page', () => {
          setupStubs()

          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)
          cy.get('input#organisational-unit-id').type(VALID_ORGANISATIONAL_UNIT_ID, { delay: 0 })
          cy.get('input#issuer').type(VALID_ISSUER, { delay: 0 })
          cy.get('input#jwt-mac-key').type(VALID_JWT_MAC_KEY, { delay: 0 })

          cy.get('button#submitCredentials').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
        })

        describe('when there are outstanding tasks', () => {
          it('should not show a success banner', () => {
            setupStubs()

            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)
            cy.get('input#organisational-unit-id').type(VALID_ORGANISATIONAL_UNIT_ID, { delay: 0 })
            cy.get('input#issuer').type(VALID_ISSUER, { delay: 0 })
            cy.get('input#jwt-mac-key').type(VALID_JWT_MAC_KEY, { delay: 0 })

            cy.get('button#submitCredentials').click()

            cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages')
              .should('not.exist')
          })
        })

        describe('when all tasks have been completed', () => {
          it('should show a success banner on the landing page', () => {
            setupStubs()

            cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)
            cy.get('input#organisational-unit-id').type(VALID_ORGANISATIONAL_UNIT_ID, { delay: 0 })
            cy.get('input#issuer').type(VALID_ISSUER, { delay: 0 })
            cy.get('input#jwt-mac-key').type(VALID_JWT_MAC_KEY, { delay: 0 })

            cy.task('clearStubs')
            setupStubs({}, [
              gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
                gateway_account_id: GATEWAY_ACCOUNT_ID,
                payment_provider: 'worldpay',
                gateway_account_credentials: [{
                  payment_provider: 'worldpay',
                  credentials: {
                    one_off_customer_initiated: {
                      merchant_code: VALID_WORLDPAY_MERCHANT_CODE,
                      username: VALID_WORLDPAY_USERNAME,
                      password: VALID_WORLDPAY_PASSWORD
                    }
                  },
                  external_id: CREDENTIAL_EXTERNAL_ID
                }],
                allow_moto: false,
                worldpay_3ds_flex: {
                  organisational_unit_id: VALID_ORGANISATIONAL_UNIT_ID,
                  issuer: VALID_ISSUER,
                  jwt_mac_key: VALID_JWT_MAC_KEY
                }
              })
            ])
            cy.get('button#submitCredentials').click()

            cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)

            cy.get('.govuk-notification-banner.govuk-notification-banner--success.system-messages')
              .should('exist')
              .should('contain.text', 'Service connected to Worldpay')
              .should('contain.text', 'This service can now take payments')
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
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`,
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
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(404))
      })
    })

    describe('where the one off customer initiated credentials task has not been completed', () => {
      beforeEach(() => {
        setupStubs({ credentials: {} })
      })

      it('should redirect to the index page when attempting to GET the /flex-credentials form', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/flex-credentials`)

        cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
        cy.get('h1').should('contain', 'Worldpay details')
        cy.title().should('eq', 'Worldpay details - Settings - My cool service - GOV.UK Pay')
      })
    })
  })
})
