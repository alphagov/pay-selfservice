const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { STRIPE } = require('@models/constants/payment-providers')
const checkTitleAndHeading = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-title-and-heading')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const { STRIPE_CREDENTIAL_IN_ACTIVE_STATE, WORLDPAY_CREDENTIAL_IN_ENTERED_STATE, WORLDPAY_CREDENTIAL_IN_CREATED_STATE } = require('@test/cypress/integration/simplified-account/service-settings/switch-psp/switch-to-worldpay/credential-states')

// test constants
const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = WORLDPAY_CREDENTIAL_IN_ENTERED_STATE.external_id
const SERVICE_NAME = { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' }
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const VALID_MOTO_MERCHANT_CODE = WORLDPAY_CREDENTIAL_IN_ENTERED_STATE.credentials.one_off_customer_initiated.merchant_code
const VALID_WORLDPAY_USERNAME = WORLDPAY_CREDENTIAL_IN_ENTERED_STATE.credentials.one_off_customer_initiated.username
const VALID_WORLDPAY_PASSWORD = WORLDPAY_CREDENTIAL_IN_ENTERED_STATE.credentials.one_off_customer_initiated.password
const SWITCH_TO_WORLDPAY_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay`
const SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay/worldpay-details/one-off-customer-initiated`
// ---

const setStubs = (opts = {}, additionalStubs = []) => {
  const pendingCredential = opts.pendingCredential || WORLDPAY_CREDENTIAL_IN_CREATED_STATE
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin'],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: STRIPE,
      provider_switch_enabled: true,
      allow_moto: opts.moto || false,
      gateway_account_credentials: [
        STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
        pendingCredential
      ]
    }),
    ...additionalStubs])
}

describe('Add Worldpay credential task', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('The settings nav', () => {
    beforeEach(() => {
      setStubs({}, [])
      cy.visit(SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL)
    })
    checkSettingsNavigation('Switch to Worldpay', SWITCH_TO_WORLDPAY_SETTINGS_URL)
  })
  describe('The page', () => {
    beforeEach(() => {
      setStubs({}, [])
      cy.visit(SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL)
    })
    checkTitleAndHeading('Your Worldpay credentials', SERVICE_NAME.en)
  })
  describe('For a non-admin', () => {
    beforeEach(() => {
      setStubs({
        role: 'view-and-refund',
        moto: true
      }, [])
      cy.visit(SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL, { failOnStatusCode: false })
    })
    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('For an admin', () => {
    describe('For a MOTO service', () => {
      describe('When no credentials have been entered previously', () => {
        beforeEach(() => {
          setStubs({
            moto: true
          })
          cy.visit(SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL)
        })
        describe('The page', () => {
          it('should have three empty inputs', () => {
            cy.get('input#merchant-code')
              .should('have.value', '')
            cy.get('input#username')
              .should('have.value', '')
            cy.get('input#password')
              .should('have.value', '')
          })
        })
      })
    })
    describe('When credentials have been entered previously', () => {
      beforeEach(() => {
        setStubs({
          moto: true,
          pendingCredential: WORLDPAY_CREDENTIAL_IN_ENTERED_STATE
        })
        cy.visit(SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL)
      })
      describe('The page', () => {
        it('should prefill the merchant code and username inputs', () => {
          cy.get('input#merchant-code')
            .should('have.value', VALID_MOTO_MERCHANT_CODE)
          cy.get('input#username')
            .should('have.value', VALID_WORLDPAY_USERNAME)
          cy.get('input#password')
            .should('have.value', '')
        })
      })
    })
    describe('When submitting credentials', () => {
      beforeEach(() => {
        setStubs({
          moto: true,
          pendingCredential: WORLDPAY_CREDENTIAL_IN_ENTERED_STATE
        }, [
          gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
            merchant_code: VALID_MOTO_MERCHANT_CODE,
            username: VALID_WORLDPAY_USERNAME,
            password: VALID_WORLDPAY_PASSWORD
          }),
          gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, SWITCHING_CREDENTIAL_EXTERNAL_ID, {
            path: 'credentials/worldpay/one_off_customer_initiated',
            value: {
              merchant_code: VALID_MOTO_MERCHANT_CODE,
              username: VALID_WORLDPAY_USERNAME,
              password: VALID_WORLDPAY_PASSWORD
            },
            userExternalId: USER_EXTERNAL_ID
          })
        ])
        cy.visit(SWITCH_TO_WORLDPAY_ADD_CREDENTIAL_TASK_SETTINGS_URL)
      })
      describe('The page', () => {
        it('should render errors when submitting empty inputs', () => {
          const emptyMerchantCodeError = 'Enter your merchant code'
          const emptyUsernameError = 'Enter your username'
          const emptyPasswordError = 'Enter your password' // pragma: allowlist secret

          cy.get('.govuk-error-summary').should('not.exist')

          cy.get('input#merchant-code')
            .clear({ force: true })
          cy.get('input#username')
            .clear({ force: true })
          cy.get('input#password')
            .clear({ force: true })

          cy.get('#credentials-form button[type="submit"]').click()
          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', emptyMerchantCodeError)
            .should('contain', emptyUsernameError)
            .should('contain', emptyPasswordError)
          cy.get('input#merchant-code')
            .should('have.class', 'govuk-input--error')
          cy.get('#merchant-code-error')
            .should('contain.text', emptyMerchantCodeError)
          cy.get('input#username')
            .should('have.class', 'govuk-input--error')
          cy.get('#username-error')
            .should('contain.text', emptyUsernameError)
          cy.get('input#password')
            .should('have.class', 'govuk-input--error')
          cy.get('#password-error')
            .should('contain.text', emptyPasswordError)
        })

        it('should render error when submitting invalid merchant code', () => {
          const invalidMerchantCodeError = 'Enter a MOTO merchant code. MOTO payments are enabled for this account'

          cy.get('.govuk-error-summary').should('not.exist')

          cy.get('input#merchant-code')
            .clear({ force: true })
            .type('notamotomerchantcode')
          cy.get('input#username')
            .clear({ force: true })
            .type(VALID_WORLDPAY_USERNAME)
          cy.get('input#password')
            .clear({ force: true })
            .type(VALID_WORLDPAY_PASSWORD)

          cy.get('#credentials-form button[type="submit"]').click()
          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', invalidMerchantCodeError)
          cy.get('input#merchant-code')
            .should('have.class', 'govuk-input--error')
          cy.get('#merchant-code-error')
            .should('contain.text', invalidMerchantCodeError)
          cy.get('input#merchant-code')
            .should('have.value', 'notamotomerchantcode')
          cy.get('input#username')
            .should('have.value', VALID_WORLDPAY_USERNAME)
          cy.get('input#password')
            .should('have.value', '')
        })

        describe('When submitting valid credentials', () => {
          it('should redirect to the task summary page on success', () => {
            cy.get('input#merchant-code')
              .clear({ force: true })
              .type(VALID_MOTO_MERCHANT_CODE)
            cy.get('input#username')
              .clear({ force: true })
              .type(VALID_WORLDPAY_USERNAME)
            cy.get('input#password')
              .clear({ force: true })
              .type(VALID_WORLDPAY_PASSWORD)
            cy.get('#credentials-form button[type="submit"]').click()
            cy.title().should('eq', `Switch to Worldpay - Settings - ${SERVICE_NAME.en} - GOV.UK Pay`)
            cy.get('h1').should('contain', 'Switch to Worldpay')
            cy.location('pathname').should('not.contain', '/worldpay-details/one-off-customer-initiated')
            cy.get('.govuk-task-list__item')
              .contains('Link your Worldpay account with GOV.UK Pay')
              .parent()
              .parent()
              .within(() => {
                cy.get('.govuk-task-list__status').should('contain.text', 'Complete')
              })
          })
        })
      })
    })
  })
})
