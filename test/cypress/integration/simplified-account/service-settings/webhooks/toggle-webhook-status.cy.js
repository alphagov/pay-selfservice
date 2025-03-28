const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const webhookStubs = require('@test/cypress/stubs/webhooks-stubs')
const webhooksStubs = require('@test/cypress/stubs/webhooks-stubs')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = { en: 'Compu-Global-Hyper-Mega-Net' }
const GATEWAY_ACCOUNT_ID = 100
const ACCOUNT_TYPE = 'test'
const WEBHOOK_EXTERNAL_ID = 'webhook-789-ghi'
const CALLBACK_URL = 'https://www.compuglobalhypermeganet.example.com'

const setStubs = (opts = {}, additionalStubs = []) => {
  const options = Object.assign({}, {
    role: 'admin',
    accountType: ACCOUNT_TYPE,
    webhookStatus: 'ACTIVE'
  }, opts)

  const WEBHOOK = {
    gateway_account_id: GATEWAY_ACCOUNT_ID,
    service_id: SERVICE_EXTERNAL_ID,
    external_id: WEBHOOK_EXTERNAL_ID,
    callback_url: CALLBACK_URL,
    description: 'a really awesome webhook',
    live: options.accountType === 'live',
    status: options.webhookStatus
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
    webhooksStubs.getWebhookSigningSecret({
      service_id: SERVICE_EXTERNAL_ID,
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      external_id: WEBHOOK_EXTERNAL_ID,
      signing_key: '123-signing-secret-456'
    }),
    webhooksStubs.getWebhookMessagesListSuccess({
      external_id: WEBHOOK_EXTERNAL_ID
    }),
    ...additionalStubs])
}

describe('webhook settings - toggle webhook status', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for an admin user', () => {
    describe('the webhook update page', () => {
      describe('for an active webhook', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin',
            webhookStatus: 'ACTIVE'
          })
        })

        it('should be accessible from the webhook detail page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)

          cy.get('a').contains('Deactivate webhook').click()

          cy.location('pathname')
            .should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

          cy.get('h1').should('contain', 'Are you sure you want to deactivate a really awesome webhook?')
          cy.title().should('eq', 'Deactivate webhook - Settings - Compu-Global-Hyper-Mega-Net - GOV.UK Pay')
        })

        it('should show active "Webhooks" link', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

          checkSettingsNavigation('Webhooks', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks`)
        })
      })

      describe('for an inactive webhook', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin',
            webhookStatus: 'INACTIVE'
          })
        })

        it('should be accessible from the webhook detail page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)

          cy.get('a').contains('Activate webhook').click()

          cy.location('pathname')
            .should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)
        })

        it('should show the correct heading and title', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

          cy.get('h1').should('contain', 'Are you sure you want to activate a really awesome webhook')
          cy.title().should('eq', 'Activate webhook - Settings - Compu-Global-Hyper-Mega-Net - GOV.UK Pay')
        })
      })
    })
    describe('when submitting the form', () => {
      describe('for an active webhook', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin',
            webhookStatus: 'ACTIVE'
          })
        })

        describe('when no option is selected', () => {
          it('should show the form with a validation error', () => {
            cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('button').contains('Save changes').click()

            cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain.text', 'Confirm if you want to deactivate a really awesome webhook')

            cy.get('#toggle-active-error').should('contain.text', 'Confirm if you want to deactivate a really awesome webhook')
          })
        })

        describe('when "no" is selected', () => {
          it('should redirect to the webhook details page', () => {
            cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('div.govuk-radios__item').filter(':contains("No")').first()
              .within(() => {
                cy.get('input.govuk-radios__input').click()
              })
            cy.get('button').contains('Save changes').click()

            cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)
          })
        })

        describe('when "yes" is selected', () => {
          beforeEach(() => {
            cy.task('setupStubs', [
              webhookStubs.patchUpdateWebhookSuccess(SERVICE_EXTERNAL_ID, WEBHOOK_EXTERNAL_ID, GATEWAY_ACCOUNT_ID, {
                path: 'status',
                value: 'INACTIVE'
              })
            ])
          })

          it('should redirect to the webhook details page', () => {
            cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('div.govuk-radios__item').filter(':contains("No")').first()
              .within(() => {
                cy.get('input.govuk-radios__input').click()
              })
            cy.get('button').contains('Save changes').click()

            cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)
          })
        })
      })

      describe('for an inactive webhook', () => {
        beforeEach(() => {
          setStubs({
            role: 'admin',
            webhookStatus: 'INACTIVE'
          })
        })

        describe('when no option is selected', () => {
          it('should show the form with a validation error', () => {
            cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('button').contains('Save changes').click()

            cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('.govuk-error-summary')
              .should('exist')
              .should('contain.text', 'Confirm if you want to activate a really awesome webhook')

            cy.get('#toggle-active-error').should('contain.text', 'Confirm if you want to activate a really awesome webhook')
          })
        })

        describe('when "no" is selected', () => {
          it('should redirect to the webhook details page', () => {
            cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('div.govuk-radios__item').filter(':contains("No")').first()
              .within(() => {
                cy.get('input.govuk-radios__input').click()
              })
            cy.get('button').contains('Save changes').click()

            cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)
          })
        })

        describe('when "yes" is selected', () => {
          beforeEach(() => {
            cy.task('setupStubs', [
              webhookStubs.patchUpdateWebhookSuccess(SERVICE_EXTERNAL_ID, WEBHOOK_EXTERNAL_ID, GATEWAY_ACCOUNT_ID, {
                path: 'status',
                value: 'ACTIVE'
              })
            ])
          })

          it('should redirect to the webhook details page', () => {
            cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`)

            cy.get('div.govuk-radios__item').filter(':contains("No")').first()
              .within(() => {
                cy.get('input.govuk-radios__input').click()
              })
            cy.get('button').contains('Save changes').click()

            cy.location('pathname').should('eq', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}`)
          })
        })
      })
    })
  })

  describe('for a non-existent webhook', () => {
    beforeEach(() => {
      setStubs({
        role: 'admin'
      })
    })

    it('should return a 404', () => {
      cy.request({
        url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/this-webhook-does-not-exist/toggle-status`,
        failOnStatusCode: false
      }).then(response => expect(response.status).to.eq(404))
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
        url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/webhooks/${WEBHOOK_EXTERNAL_ID}/toggle-status`,
        failOnStatusCode: false
      }).then(response => expect(response.status).to.eq(403))
    })
  })
})
