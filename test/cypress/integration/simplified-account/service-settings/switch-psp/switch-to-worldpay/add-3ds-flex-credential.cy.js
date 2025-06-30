const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const checkTitleAndHeading = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-title-and-heading')
const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { STRIPE } = require('@models/constants/payment-providers')
const { STRIPE_CREDENTIAL_IN_ACTIVE_STATE, WORLDPAY_CREDENTIAL_IN_CREATED_STATE } = require('@test/fixtures/credential-states')

// test constants
const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const LIVE_ACCOUNT_TYPE = 'live'
const SERVICE_NAME = 'My cool service'
const GATEWAY_ACCOUNT_ID = 11
const SWITCH_TO_WORLDPAY_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay`
const SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay/flex-credentials`
const A_VALID_ORG_UNIT_ID = '5bd9b55e4444761ac0af1c80'
const A_VALID_ISSUER = '5bd9e0e4444dce15fed8c940' // pragma: allowlist secret
const A_VALID_JWT_MAC_KEY = 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'

const setupStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: `${SERVICE_NAME}` },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin']
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: STRIPE,
      provider_switch_enabled: true,
      worldpay_3ds_flex: opts.worldpay_3ds_flex || undefined,
      gateway_account_credentials: [
        STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
        WORLDPAY_CREDENTIAL_IN_CREATED_STATE
      ]
    }),
    ...additionalStubs])
}

describe('Add 3DS Flex credential task', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('The settings nav', () => {
    beforeEach(() => {
      setupStubs()
      cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL)
    })
    it('should show active "Switch to Worldpay" link', () => {
      checkSettingsNavigation('Switch to Worldpay', SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
  })

  describe('The page', () => {
    beforeEach(() => {
      setupStubs()
      cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL)
    })
    it('should have the correct title and heading', () => {
      checkTitleAndHeading('Your Worldpay 3DS Flex credentials', SERVICE_NAME)
    })
  })

  describe('For a non-admin', () => {
    beforeEach(() => {
      setupStubs({
        role: 'view-and-refund'
      })
      cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL, { failOnStatusCode: false })
    })
    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('For an admin', () => {
    describe('When no credentials have been entered previously', () => {
      beforeEach(() => {
        setupStubs()
        cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL)
      })
      it('The page should have three empty inputs', () => {
        cy.get('input#organisational-unit-id').should('have.value', '')
        cy.get('input#issuer').should('have.value', '')
        cy.get('input#jwt-mac-key').should('have.value', '')
      })
    })

    describe('When credentials have been entered previously', () => {
      beforeEach(() => {
        setupStubs({
          worldpay_3ds_flex: {
            organisational_unit_id: A_VALID_ORG_UNIT_ID,
            issuer: A_VALID_ISSUER,
            jwt_mac_key: A_VALID_JWT_MAC_KEY
          }
        })
        cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL)
      })
      it('The page should be prefilled with the 3DS flex credentials', () => {
        cy.get('input#organisational-unit-id').should('have.value', A_VALID_ORG_UNIT_ID)
        cy.get('input#issuer').should('have.value', A_VALID_ISSUER)
        cy.get('input#jwt-mac-key').should('have.value', '')
      })
    })

    describe('When submitting credentials', () => {
      describe('For invalid credentials', () => {
        beforeEach(() => {
          setupStubs()
          cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL)
        })
        it('should render errors when submitting empty or invalid inputs', () => {
          const invalidOrgUnitIdError = 'Enter your organisational unit ID in the format you received it'
          const emptyIssuerError = 'Enter your issuer'
          const emptyJwtMacKeyError = 'Enter your JWT MAC key'

          cy.get('.govuk-error-summary').should('not.exist')

          cy.get('input#organisational-unit-id').clear({ force: true }).type('not a hexadecimal')
          cy.get('input#issuer').clear({ force: true })
          cy.get('input#jwt-mac-key').clear({ force: true })

          cy.get('#flex-credentials-form button[type="submit"]').click()

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain', invalidOrgUnitIdError)
            .should('contain', emptyIssuerError)
            .should('contain', emptyJwtMacKeyError)

          cy.get('input#organisational-unit-id').should('have.class', 'govuk-input--error')
          cy.get('#organisational-unit-id-error').should('contain.text', invalidOrgUnitIdError)
          cy.get('input#issuer').should('have.class', 'govuk-input--error')
          cy.get('#issuer-error').should('contain.text', emptyIssuerError)
          cy.get('input#jwt-mac-key').should('have.class', 'govuk-input--error')
          cy.get('#jwt-mac-key-error').should('contain.text', emptyJwtMacKeyError)
        })
      })

      describe('For valid credentials', () => {
        beforeEach(() => {
          setupStubs({}, [
            gatewayAccountStubs.postCheckWorldpay3dsFlexByServiceExternalIdAndType(
              SERVICE_EXTERNAL_ID,
              LIVE_ACCOUNT_TYPE,
              {
                organisational_unit_id: A_VALID_ORG_UNIT_ID,
                issuer: A_VALID_ISSUER,
                jwt_mac_key: A_VALID_JWT_MAC_KEY
              }),
            gatewayAccountStubs.putWorldpay3dsFlexByServiceExternalIdAndType(
              SERVICE_EXTERNAL_ID,
              LIVE_ACCOUNT_TYPE,
              {
                organisational_unit_id: A_VALID_ORG_UNIT_ID,
                issuer: A_VALID_ISSUER,
                jwt_mac_key: A_VALID_JWT_MAC_KEY
              }),
            gatewayAccountStubs.patchUpdate3dsVersionByServiceExternalIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE)
          ])
          cy.visit(SWITCH_TO_WORLDPAY_ADD_3DS_FLEX_CREDENTIAL_TASK_SETTINGS_URL)
        })
        it('should redirect to the task summary page on success', () => {
          cy.get('input#organisational-unit-id').clear({ force: true }).type(A_VALID_ORG_UNIT_ID)
          cy.get('input#issuer').clear({ force: true }).type(A_VALID_ISSUER)
          cy.get('input#jwt-mac-key').clear({ force: true }).type(A_VALID_JWT_MAC_KEY)

          cy.get('#flex-credentials-form button[type="submit"]').click()

          cy.title().should('eq', `Switch to Worldpay - Settings - ${SERVICE_NAME} - GOV.UK Pay`)
          cy.get('h1').should('contain', 'Switch to Worldpay')
          cy.url().should('include', SWITCH_TO_WORLDPAY_SETTINGS_URL)
        })
      })
    })
  })
})
