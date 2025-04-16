const userStubs = require('@test/cypress/stubs/user-stubs')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { WORLDPAY } = require('@models/constants/payment-providers')
const ROLES = require('@test/fixtures/roles.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'
const CREDENTIAL_EXTERNAL_ID = 'worldpay-credentials-xyz'
const VALID_MIT_MERCHANT_CODE = 'A-VALID-MIT-MERCHANT-CODE'
const VALID_CIT_MERCHANT_CODE = 'A-VALID-CIT-MERCHANT-CODE'
const VALID_WORLDPAY_USERNAME = 'worldpay-user'
const VALID_WORLDPAY_PASSWORD = 'worldpay-password' // pragma: allowlist secret
const WORLDPAY_DETAILS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`

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
      role: ROLES[options.role]
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: options.paymentProvider,
      recurring_enabled: opts.recurringEnabled,
      gateway_account_credentials: [{
        payment_provider: options.paymentProvider,
        credentials: options.credentials,
        external_id: CREDENTIAL_EXTERNAL_ID
      }],
      allow_moto: false
    }),
    gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      merchant_code: VALID_CIT_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }),
    gatewayAccountStubs.postCheckWorldpayCredentialsByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      merchant_code: VALID_MIT_MERCHANT_CODE,
      username: VALID_WORLDPAY_USERNAME,
      password: VALID_WORLDPAY_PASSWORD
    }),
    gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, {
      path: 'credentials/worldpay/recurring_customer_initiated',
      value: {
        merchant_code: VALID_CIT_MERCHANT_CODE,
        username: VALID_WORLDPAY_USERNAME,
        password: VALID_WORLDPAY_PASSWORD
      },
      userExternalId: USER_EXTERNAL_ID
    }),
    gatewayAccountStubs.patchUpdateCredentialsSuccessByServiceExternalIdAndType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, CREDENTIAL_EXTERNAL_ID, {
      path: 'credentials/worldpay/recurring_merchant_initiated',
      value: {
        merchant_code: VALID_MIT_MERCHANT_CODE,
        username: VALID_WORLDPAY_USERNAME,
        password: VALID_WORLDPAY_PASSWORD
      },
      userExternalId: USER_EXTERNAL_ID
    })
  ])
}

describe('Worldpay details settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('For an non-admin user', () => {
    beforeEach(() => {
      setupStubs({ role: 'view-only' })
    })
    it('should return a 403', () => {
      [`${WORLDPAY_DETAILS_URL}/recurring-customer-initiated`, `${WORLDPAY_DETAILS_URL}/recurring-merchant-initiated`].forEach(
        url => cy.request({
          url,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(403))
      )
    })
  })
  describe('For an admin user', () => {
    describe('For a gateway account that does not have recurring payments enabled', () => {
      beforeEach(() => {
        setupStubs({ recurringEnabled: false })
        cy.visit(WORLDPAY_DETAILS_URL)
      })
      it('should not show CIT and MIT credentials tasks', () => {
        cy.contains('a.govuk-link', 'Recurring customer initiated transaction (CIT) credentials').should('not.exist')
        cy.contains('a.govuk-link', 'Recurring merchant initiated transaction (MIT) credentials').should('not.exist')
      })
    })

    describe('For a gateway account that has recurring payments enabled', () => {
      beforeEach(() => {
        setupStubs({ recurringEnabled: true })
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
      })

      it('should show CIT and MIT credentials tasks', () => {
        cy.contains('a.govuk-link', 'Recurring customer initiated transaction (CIT) credentials').should('exist')
          .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/recurring-customer-initiated`)
        cy.contains('a.govuk-link', 'Recurring merchant initiated transaction (MIT) credentials').should('exist')
          .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/recurring-merchant-initiated`)
        cy.contains('a.govuk-link', 'Link your Worldpay account with GOV.UK Pay').should('not.exist')
        cy.contains('a.govuk-link', 'Configure 3DS').should('exist')
      })

      it('should be able to provide MIT credentials', () => {
        cy.contains('a', 'Recurring merchant initiated transaction (MIT) credentials').click()

        cy.title().should('eq', 'Recurring merchant initiated transaction (MIT) credentials - Settings - My cool service - GOV.UK Pay')
        cy.get('h1').should('have.text', 'Recurring merchant initiated transaction (MIT) credentials')

        cy.get('input[name="merchantCode"]').type(VALID_MIT_MERCHANT_CODE)
        cy.get('input[name="username"]').type(VALID_WORLDPAY_USERNAME)
        cy.get('input[name="password"]').type(VALID_WORLDPAY_PASSWORD)

        cy.get('#submitCredentials').click()
        cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
        cy.get('h1').should('contain', 'Worldpay details')
      })

      it('should be able to provide CIT credentials', () => {
        cy.contains('a', 'Recurring customer initiated transaction (CIT) credentials').click()

        cy.title().should('eq', 'Recurring customer initiated transaction (CIT) credentials - Settings - My cool service - GOV.UK Pay')
        cy.get('h1').should('have.text', 'Recurring customer initiated transaction (CIT) credentials')

        cy.get('input[name="merchantCode"]').type(VALID_CIT_MERCHANT_CODE)
        cy.get('input[name="username"]').type(VALID_WORLDPAY_USERNAME)
        cy.get('input[name="password"]').type(VALID_WORLDPAY_PASSWORD)

        cy.get('#submitCredentials').click()
        cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details`)
        cy.get('h1').should('contain', 'Worldpay details')
      })

      it('should link back to the Worldpay details page', () => {
        cy.contains('a', 'Recurring customer initiated transaction (CIT) credentials').click()
        cy.contains('a', 'Back').click()
        cy.location('pathname').should('eq', WORLDPAY_DETAILS_URL)
      })

      describe('when there are validation errors', () => {
        it('should return to the edit MIT credentials page and show the validation errors', () => {
          cy.contains('a', 'Recurring merchant initiated transaction (MIT) credentials').click()
          cy.get('#submitCredentials').click()
          cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/recurring-merchant-initiated`)
          cy.contains('h2', 'There is a problem').should('exist')
          cy.get('.govuk-error-summary__body').within(() => {
            cy.get('a').eq(0).should('have.attr', 'href', '#merchant-code')
            cy.get('a').eq(1).should('have.attr', 'href', '#username')
            cy.get('a').eq(2).should('have.attr', 'href', '#password')
          })
        })

        it('should return to the edit CIT credentials page and show the validation errors', () => {
          cy.contains('a', 'Recurring customer initiated transaction (CIT) credentials').click()
          cy.get('#submitCredentials').click()
          cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/recurring-customer-initiated`)
          cy.contains('h2', 'There is a problem').should('exist')
          cy.get('.govuk-error-summary__body').within(() => {
            cy.get('a').eq(0).should('have.attr', 'href', '#merchant-code')
            cy.get('a').eq(1).should('have.attr', 'href', '#username')
            cy.get('a').eq(2).should('have.attr', 'href', '#password')
          })
        })
      })
    })
  })
})
