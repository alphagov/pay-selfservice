const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const webhookStubs = require('@test/cypress/stubs/webhooks-stubs')
const webhooksStubs = require('@test/cypress/stubs/webhooks-stubs')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const SERVICE_NAME = { en: 'Compu-Global-Hyper-Mega-Net' }
const GATEWAY_ACCOUNT_ID = 100
const ACCOUNT_TYPE = 'test'
const WEBHOOK_EXTERNAL_ID = 'webhook-789-ghi'
const CALLBACK_URL = 'https://www.compuglobalhypermeganet.example.com'

const VALID_PATCHES = [{
  path: 'description',
  value: 'This is a new description for my webhook'
}, {
  path: 'callback_url',
  value: 'https://this.url.is.valid.gov.uk'
}, {
  path: 'subscriptions',
  value: [
    'card_payment_succeeded',
    'card_payment_captured'
  ]
}]

const setStubs = (opts = {}, additionalStubs = []) => {
  const options = Object.assign({}, {
    role: 'admin',
    accountType: ACCOUNT_TYPE,
    patchSuccess: true
  }, opts)
  const patchStub = options.patchSuccess
    ? webhookStubs.patchBatchUpdateWebhookSuccess(GATEWAY_ACCOUNT_ID, SERVICE_EXTERNAL_ID, WEBHOOK_EXTERNAL_ID, VALID_PATCHES)
    : webhookStubs.patchUpdateWebhookViolatesBackend(GATEWAY_ACCOUNT_ID, SERVICE_EXTERNAL_ID, WEBHOOK_EXTERNAL_ID)

  const WEBHOOK = {
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    service_id: SERVICE_EXTERNAL_ID,
    external_id: WEBHOOK_EXTERNAL_ID,
    callback_url: CALLBACK_URL,
    description: 'a really awesome webhook',
    live: options.accountType === 'live'
  }

  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[options.role],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: options.accountType
    }),
    webhookStubs.getWebhookSuccess(WEBHOOK),
    webhookStubs.getWebhooksListSuccess({
      service_id: SERVICE_EXTERNAL_ID,
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      live: options.accountType === 'live',
      webhooks: [WEBHOOK]
    }),
    webhooksStubs.getWebhookSigningSecret({
      service_id: SERVICE_EXTERNAL_ID,
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: WEBHOOK_EXTERNAL_ID,
      signing_key: '123-signing-secret-456'
    }),
    webhooksStubs.getWebhookMessagesListSuccess({
      external_id: WEBHOOK_EXTERNAL_ID
    }),
    patchStub,
    ...additionalStubs])
}

describe('webhook settings - update webhooks', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for an admin user', () => {
    describe('the webhook update page', () => {
      beforeEach(() => {
        setStubs({
          role: 'admin'
        })
      })

      it('should be accessible from the webhook list page', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks`)

        cy.get('a').contains('Update').click()

        cy.location('pathname')
          .should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)
      })

      it('should be accessible from the webhook detail page', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)

        cy.get('a').contains('Update webhook').click()

        cy.location('pathname')
          .should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)
      })

      it('should show the correct heading and title', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)

        cy.get('h1').should('contain', 'Webhook details')
        cy.title().should('eq', 'Webhook details - Settings - Compu-Global-Hyper-Mega-Net - GOV.UK Pay')
      })

      it('should show active "Webhooks" link', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)

        checkSettingsNavigation('Webhooks', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks`)
      })
    })

    describe('when submitting the update webhook form', () => {
      describe('when there are validation errors', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin'
          })
        })

        it('should render the form with the validation errors', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)

          cy.get('input#callback_url').clear().type('http://this.url.is.invalid.becuase.it.is.not.https.com', { delay: 0 })
          // cy.get('input#description').clear().type('a'.repeat(100), { delay: 0 })
          cy.get('div.govuk-checkboxes__item').filter(':contains("Payment captured")').first()
            .within(() => {
              cy.get('input.govuk-checkboxes__input').click()
            })

          cy.get('button').contains('Save').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain.text', 'Select at least one payment event')
            .should('contain.text', 'Enter a valid callback url beginning with https://')

          cy.get('#callback_url-error').should('contain.text', 'Enter a valid callback url beginning with https://')
          cy.get('#subscriptions-error').should('contain.text', 'Select at least one payment event')
        })
      })

      describe('when the callback URL domain is not in the allowlist', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin',
            patchSuccess: false
          })
        })

        it('should render the form with the validation error', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)
          cy.get('input#callback_url').clear().type('https://this.url.is.invalid.becuase.the.domain.is.not.in.the.allowlist.biz', { delay: 0 })

          cy.get('button').contains('Save').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)

          cy.get('.govuk-error-summary')
            .should('exist')
            .should('contain.text', 'Callback URL must be approved. Please contact support')

          cy.get('#callback_url-error').should('contain.text', 'Callback URL must be approved. Please contact support')
        })
      })

      describe('when the submitted details are valid', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin'
          })
        })

        it('should redirect to the webhook detail page', () => {
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`)
          cy.get('input#callback_url').clear().type('https://this.url.is.valid.gov.uk', { delay: 0 })
          cy.get('input#description').clear().type('This is a new description for my webhook', { delay: 0 })
          cy.get('div.govuk-checkboxes__item').filter(':contains("Payment succeeded")').first()
            .within(() => {
              cy.get('input.govuk-checkboxes__input').click()
            })

          cy.get('button').contains('Save').click()

          cy.location('pathname').should('eq', `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)
        })
      })
    })

    describe('for a non-existent webhook', () => {
      beforeEach(() => {
        setStubs({
          role: 'admin',
          accountType: 'live'
        })
      })

      it('should respond with a 404', () => {
        cy.request({
          url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/this-webhook-does-not-exist/update`,
          failOnStatusCode: false
        }).then(response => expect(response.status).to.eq(404))
      })
    })
  })

  describe('for a non-admin user', () => {
    beforeEach(() => {
      setStubs({
        role: 'view-only'
      })
    })

    it('should return a 403', () => {
      cy.request({
        url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/update`,
        failOnStatusCode: false
      }).then(response => expect(response.status).to.eq(403))
    })
  })
})
