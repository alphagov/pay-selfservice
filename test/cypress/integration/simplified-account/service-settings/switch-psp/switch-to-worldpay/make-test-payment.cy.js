const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const connectorChargeStubs = require('@test/cypress/stubs/connector-charge-stubs')
const { STRIPE } = require('@models/constants/payment-providers')
const checkTitleAndHeading = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-title-and-heading')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const {
  STRIPE_CREDENTIAL_IN_ACTIVE_STATE,
  WORLDPAY_CREDENTIAL_IN_ENTERED_STATE,
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE, WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE
} = require('@test/cypress/integration/simplified-account/service-settings/helpers/credential-states')
const CREDENTIAL_STATE = require('@models/constants/credential-state')
const { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY } = require('@utils/verify-psp-integration')

// test constants
const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const CHARGE_EXTERNAL_ID = 'charge-456-def'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = WORLDPAY_CREDENTIAL_IN_ENTERED_STATE.external_id
const SERVICE_NAME = { en: 'McDuck Enterprises', cy: 'Mentrau McDuck' }
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10
const SWITCH_TO_WORLDPAY_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay`
const SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay/worldpay-details/make-a-payment`
const SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_RETURN_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay/worldpay-details/make-a-payment/verify`
// ---

const setStubs = (opts = {}, additionalStubs = []) => {
  const pendingCredential = opts.pendingCredential || WORLDPAY_CREDENTIAL_IN_ENTERED_STATE
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

describe('Make a live payment task', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID, {
      [VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]: CHARGE_EXTERNAL_ID
    })
  })
  describe('The settings nav', () => {
    beforeEach(() => {
      setStubs({
        moto: true
      }, [])
      cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL)
    })
    it('should show active "Switch to Worldpay" link', () => {
      checkSettingsNavigation('Switch to Worldpay', SWITCH_TO_WORLDPAY_SETTINGS_URL)
    })
  })
  describe('The page', () => {
    beforeEach(() => {
      setStubs({
        moto: true
      }, [])
      cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL)
    })
    it('should have the correct title and heading', () => {
      checkTitleAndHeading('Test the connection between Worldpay and GOV.UK Pay', SERVICE_NAME.en)
    })
    it('should show the expected content', () => {
      cy.get('#make-a-payment button[type="submit"]')
        .should('contain.text', 'Continue to live payment')
    })
  })
  describe('For a non-admin', () => {
    beforeEach(() => {
      setStubs({
        role: 'view-and-refund',
        moto: true
      }, [])
      cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL, { failOnStatusCode: false })
    })
    it('should show admin only error', () => {
      cy.title().should('eq', 'An error occurred - GOV.UK Pay')
      cy.get('h1').should('contain.text', 'An error occurred')
      cy.get('#errorMsg').should('contain.text', 'You do not have the administrator rights to perform this operation.')
    })
  })

  describe('For an admin', () => {
    describe('For a MOTO service', () => {
      describe('When task is attempted out of sequence', () => {
        beforeEach(() => {
          setStubs({
            moto: true,
            pendingCredential: WORLDPAY_CREDENTIAL_IN_CREATED_STATE // no credentials entered so task cannot be started
          }, [])
        })
        it('should be redirected back to the tasks index', () => {
          cy.request({
            url: SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL,
            followRedirect: false
          }).then((resp) => {
            expect(resp.status).to.eq(302)
          })
          cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL, { failOnStatusCode: false })
          cy.title().should('eq', `Switch to Worldpay - Settings - ${SERVICE_NAME.en} - GOV.UK Pay`)
          cy.get('h1').should('contain', 'Switch to Worldpay')
          cy.location('pathname').should('not.contain', '/worldpay-details/make-a-payment')
        })
      })
      describe('When starting the task', () => {
        describe('Clicking the "Continue to live payment" button', () => {
          beforeEach(() => {
            setStubs({
              moto: true
            }, [
              connectorChargeStubs.postChargeRequestSuccessByServiceExternalIdAndAccountType({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                accountType: LIVE_ACCOUNT_TYPE,
                chargeExternalId: CHARGE_EXTERNAL_ID,
                nextUrl: 'https://notfrontend.gov.uk'
              })
            ])
            cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_SETTINGS_URL)
          })
          it('should redirect the user to complete a payment', () => {
            cy.intercept('https://notfrontend.gov.uk', {
              statusCode: 200
            }).as('frontendCall')

            cy.get('#make-a-payment button[type="submit"]').click()

            cy.wait('@frontendCall').then((interception) => {
              expect(interception.request).to.exist // eslint-disable-line
              expect(interception.request.method).to.equal('GET')
              expect(interception.response.statusCode).to.equal(200)
            })
          })
        })
      })
      describe('When completing the task', () => {
        describe('The user completes the payment successfully', () => {
          beforeEach(() => {
            setStubs({
              moto: true,
              pendingCredential: WORLDPAY_CREDENTIAL_IN_VERIFIED_STATE
            }, [
              connectorChargeStubs.getChargeSuccessByServiceExternalIdAndAccountType({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                accountType: LIVE_ACCOUNT_TYPE,
                chargeExternalId: CHARGE_EXTERNAL_ID
              }),
              gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(
                SERVICE_EXTERNAL_ID,
                LIVE_ACCOUNT_TYPE,
                SWITCHING_CREDENTIAL_EXTERNAL_ID,
                {
                  path: 'state',
                  value: CREDENTIAL_STATE.VERIFIED,
                  userExternalId: USER_EXTERNAL_ID
                })
            ])
            cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_RETURN_URL)
          })
          it('should be redirected back to the tasks index with a success message', () => {
            cy.get('.govuk-notification-banner')
              .should('have.class', 'govuk-notification-banner--success')
              .should('have.class', 'system-messages')
              .contains('Payment verified')
              .parent()
              .contains('This service is ready to switch to Worldpay')
          })
          it('should show the option to complete the switch', () => {
            cy.get('#switch-psp button[type="submit"]')
              .should('exist')
              .should('contain.text', 'Switch to Worldpay')
          })
        })

        describe('The user does not complete the payment', () => {
          beforeEach(() => {
            setStubs({
              moto: true
            }, [
              connectorChargeStubs.getChargeSuccessByServiceExternalIdAndAccountType({
                serviceExternalId: SERVICE_EXTERNAL_ID,
                accountType: LIVE_ACCOUNT_TYPE,
                chargeExternalId: CHARGE_EXTERNAL_ID,
                status: 'cancelled'
              })
            ])
            cy.visit(SWITCH_TO_WORLDPAY_MAKE_A_PAYMENT_TASK_RETURN_URL)
          })
          it('should be redirected back to the tasks index with an error message', () => {
            cy.get('.govuk-notification-banner')
              .should('have.class', 'govuk-notification-banner--error')
              .should('have.class', 'system-messages')
              .contains('There is a problem')
              .parent()
              .contains('The payment has failed. Check your Worldpay credentials and try again. If you need help, contact govuk-pay-support@digital.cabinet-office.gov.uk')
          })
          it('should not show the option to complete the switch', () => {
            cy.get('#switch-psp button[type="submit"]')
              .should('not.exist')
          })
        })
      })
    })
  })
})
