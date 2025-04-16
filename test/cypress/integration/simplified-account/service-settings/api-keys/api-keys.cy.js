const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const apiKeysStubs = require('@test/cypress/stubs/api-keys-stubs')
const { Token } = require('@models/Token.class')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'
const USER_EMAIL = 'potter@wand.com'
const API_KEYS_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`

const setupStubs = (role = 'admin', activeApiKeys = [], revokedApiKeys = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      email: USER_EMAIL,
      role: ROLES[role],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, { gateway_account_id: GATEWAY_ACCOUNT_ID }),
    apiKeysStubs.getActiveApiKeysForGatewayAccount(GATEWAY_ACCOUNT_ID, activeApiKeys),
    apiKeysStubs.getRevokedApiKeysForGatewayAccount(GATEWAY_ACCOUNT_ID, revokedApiKeys)
  ])
}

describe('Settings - API keys', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for an admin user', () => {
    describe('view the Revoked API keys page', () => {
      describe('when there are revoked keys', () => {
        const revokedKeys = [
          new Token().withCreatedBy('Mr Smith').withDescription('description1')
            .withIssuedDate('12 Dec 2024').withTokenLink('token-link-1')
            .withRevokedDate('12 Jan 2025'),
          new Token().withCreatedBy('Mrs Smith').withDescription('description2')
            .withIssuedDate('10 Dec 2024').withLastUsed('10 Dec 2024').withTokenLink('token-link-2')
            .withRevokedDate('10 Jan 2025')
        ]

        beforeEach(() => {
          setupStubs('admin', [], revokedKeys)
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        })

        it('should show the "Show revoked API keys" button on the index page', () => {
          cy.contains('a.govuk-button', 'Show revoked API keys').should('exist')
        })

        it('should show the list of revoked keys', () => {
          cy.contains('a', 'Show revoked API keys').click()
          cy.contains('h1', 'Revoked API keys (2)').should('exist')

          verifySummaryCard(0, revokedKeys[0], true)
          verifySummaryCard(1, revokedKeys[1], true)
        })

        function verifySummaryCard (pos, token, revoked) {
          cy.get('div.govuk-summary-card').eq(pos)
            .within(() => {
              cy.get('.govuk-summary-card__title').should('contain', token.description)

              cy.get('.govuk-summary-list__row').eq(0)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Created by')
                  cy.get('.govuk-summary-list__value').should('contain', token.createdBy)
                })

              cy.get('.govuk-summary-list__row').eq(1)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Date created')
                  cy.get('.govuk-summary-list__value').should('contain', token.issuedDate)
                })

              cy.get('.govuk-summary-list__row').eq(2)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Last used')
                  if (token.lastUsed === undefined) {
                    cy.get('.govuk-summary-list__value').should('contain', revoked ? 'Never used' : 'Not used yet')
                  } else {
                    cy.get('.govuk-summary-list__value').should('contain', token.lastUsed)
                  }
                })

              cy.get('.govuk-summary-list__row').eq(3)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Date revoked')
                  cy.get('.govuk-summary-list__value').should('contain', token.revokedDate)
                })
            })
        }
      })

      describe('when there are no revoked keys', () => {
        beforeEach(() => {
          setupStubs()
        })

        it('should not show the "Show revoked API keys" button on the index page', () => {
          cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
          cy.contains('a.govuk-button', 'Show revoked API keys').should('not.exist')
        })

        it('should return a 404 when trying to access the revoke page directly', () => {
          cy.request({
            url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys/revoked`,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.eq(404)
          })
        })
      })
    })

    describe('when there are no active API keys', () => {
      beforeEach(() => {
        setupStubs()
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
      })
      it('should show appropriate buttons and text', () => {
        cy.get('#settings-navigation-api-keys').should('have.text', 'API keys')
        cy.get('.service-settings-pane')
          .find('a')
          .contains('Create a new API key')
          .should('exist')
        cy.get('.service-settings-pane')
          .find('h2')
          .contains('There are no active test API keys')
          .should('exist')
      })
    })

    describe('when there are active API keys', () => {
      const apiKeys = [
        new Token().withCreatedBy('system generated').withDescription('description')
          .withIssuedDate('12 Dec 2024').withTokenLink('token-link-1'),
        new Token().withCreatedBy('algae bra').withDescription('mathematical clothes')
          .withIssuedDate('10 Dec 2024').withLastUsed('10 Dec 2024').withTokenLink('token-link-2')
      ]

      beforeEach(() => {
        setupStubs('admin', apiKeys)
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
      })

      it('should show appropriate buttons and text', () => {
        cy.get('#settings-navigation-api-keys').should('have.text', 'API keys')
        cy.get('.service-settings-pane')
          .find('a')
          .contains('Create a new API key')
          .should('exist')
        cy.get('.service-settings-pane')
          .find('h2')
          .contains('Active test API keys (2)')
          .should('exist')
        cy.get('.service-settings-pane')
          .find('a')
          .contains('Show revoked API keys')
          .should('not.exist')
      })

      it('should list the api keys', () => {
        cy.get('div.govuk-summary-card').should('have.length', 2)

        function verifySummaryCard (pos, token) {
          cy.get('div.govuk-summary-card').eq(pos)
            .within(() => {
              cy.get('.govuk-summary-card__title').should('contain', token.description)

              cy.get('.govuk-summary-card__action').eq(0)
                .within(() => {
                  cy.get('a')
                    .should('contain.text', 'Change name')
                    .and('have.attr', 'href', `${API_KEYS_SETTINGS_URL}/${token.tokenLink}/change-name`)
                })

              cy.get('.govuk-summary-card__action').eq(1)
                .within(() => {
                  cy.get('a')
                    .should('contain.text', 'Revoke')
                    .and('have.attr', 'href', `${API_KEYS_SETTINGS_URL}/${token.tokenLink}/revoke`)
                })

              cy.get('.govuk-summary-list__row').eq(0)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Created by')
                  cy.get('.govuk-summary-list__value').should('contain', token.createdBy)
                })

              cy.get('.govuk-summary-list__row').eq(1)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Date created')
                  cy.get('.govuk-summary-list__value').should('contain', token.issuedDate)
                })

              cy.get('.govuk-summary-list__row').eq(2)
                .within(() => {
                  cy.get('.govuk-summary-list__key').should('contain', 'Last used')
                  if (token.lastUsed === undefined) {
                    cy.get('.govuk-summary-list__value').should('contain', 'Not used yet')
                  } else {
                    cy.get('.govuk-summary-list__value').should('contain', token.lastUsed)
                  }
                })
            })
        }

        verifySummaryCard(0, apiKeys[0])
        verifySummaryCard(1, apiKeys[1])
      })
    })

    describe('create an api key', () => {
      const API_KEY_DESCRIPTION = 'api key description' // pragma: allowlist secret
      const EXPECTED_TOKEN = 'api_test_123abc'

      beforeEach(() => {
        setupStubs()
        cy.task('setupStubs', [
          apiKeysStubs.createApiKey(GATEWAY_ACCOUNT_ID, USER_EMAIL, API_KEY_DESCRIPTION, EXPECTED_TOKEN)
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
      })

      it('successfully', () => {
        cy.contains('a', 'Create a new API key').click()
        cy.contains('h1', 'API key name').should('exist')
        cy.get('input[name="keyName"]').type(API_KEY_DESCRIPTION)
        cy.contains('button', 'Continue').click()
        cy.contains('h1', 'New API key').should('exist')
        cy.contains('h2', API_KEY_DESCRIPTION).should('exist')
        cy.get('#api-key').should('have.text', EXPECTED_TOKEN)
        cy.get('#copy-key-button')
          .should('have.attr', 'data-copy-text', 'true')
          .should('have.attr', 'data-target', 'copy-this-api-key')
      })

      it('unsuccessfully', () => {
        cy.contains('a', 'Create a new API key').click()
        cy.contains('h1', 'API key name').should('exist')
        cy.contains('button', 'Continue').click()
        cy.get('.govuk-error-summary__body').within(() => {
          cy.contains('a', 'Enter the API key name').should('exist')
          cy.get('a').should('have.attr', 'href', '#key-name')
        })
      })
    })

    describe('revoke an api key', () => {
      const TOKEN_LINK = 'token-link-2'
      const DESCRIPTION = 'my api key'
      const apiKeys = [
        new Token().withCreatedBy('joe bloggs').withDescription(DESCRIPTION)
          .withIssuedDate('10 Dec 2024').withLastUsed('10 Dec 2024').withTokenLink(TOKEN_LINK)
      ]

      beforeEach(() => {
        setupStubs('admin', apiKeys)
        cy.task('setupStubs', [
          apiKeysStubs.getKeyByTokenLink(GATEWAY_ACCOUNT_ID, TOKEN_LINK, DESCRIPTION),
          apiKeysStubs.revokeKey(GATEWAY_ACCOUNT_ID, TOKEN_LINK)
        ])
      })

      it('should show validation errors if nothing is selected', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        cy.get('.govuk-summary-card').within(() => {
          cy.contains('h2', DESCRIPTION).should('exist')
          cy.contains('a', 'Revoke').click()
        })
        cy.contains('button', 'Save changes').click()
        cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys/${TOKEN_LINK}/revoke`)
        cy.get('.govuk-error-summary').within(() => {
          cy.contains('h2', 'There is a problem').should('exist')
          cy.contains('a', `Confirm if you want to revoke ${DESCRIPTION}`).should('exist')
        })
      })

      it('should revoke the api key successfully when Yes is selected', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        cy.get('.govuk-summary-card').within(() => {
          cy.contains('h2', DESCRIPTION).should('exist')
          cy.contains('a', 'Revoke').click()
        })
        cy.get('input[type="radio"][value="yes"]').check()
        cy.contains('button', 'Save changes').click()
        cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        cy.contains('h1', 'Test API keys').should('exist')
        cy.contains('p.govuk-notification-banner__heading', `${DESCRIPTION} was successfully revoked`).should('exist')
      })

      it('should not revoke the api key when No is selected', () => {
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        cy.get('.govuk-summary-card').within(() => {
          cy.contains('h2', DESCRIPTION).should('exist')
          cy.contains('a', 'Revoke').click()
        })
        cy.get('input[type="radio"][value="no"]').check()
        cy.contains('button', 'Save changes').click()
        cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        cy.contains('h1', 'Test API keys').should('exist')
        cy.contains('p.govuk-notification-banner__heading', `${DESCRIPTION} was successfully revoked`).should('not.exist')
      })
    })

    describe('re-name an api key', () => {
      const NEW_API_KEY_NAME = 'api key description' // pragma: allowlist secret
      const TOKEN_LINK = 'token-link-1'

      const apiKeys = [
        new Token().withCreatedBy('algae bra').withDescription('mathematical clothes')
          .withIssuedDate('10 Dec 2024').withLastUsed('10 Dec 2024').withTokenLink(TOKEN_LINK)
      ]

      beforeEach(() => {
        setupStubs('admin', apiKeys)
        cy.task('setupStubs', [
          apiKeysStubs.getKeyByTokenLink(GATEWAY_ACCOUNT_ID, TOKEN_LINK, 'mathematical clothes'),
          apiKeysStubs.changeApiKeyName(TOKEN_LINK, NEW_API_KEY_NAME)
        ])
        cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
      })

      it('show the API key name page', () => {
        cy.get('.govuk-summary-card').within(() => {
          cy.contains('h2', 'mathematical clothes').should('exist')
          cy.contains('a', 'Change name').click()
        })
        cy.contains('h1', 'API key name').should('exist')
      })

      it('should re-name the api key successfully', () => {
        cy.get('.govuk-summary-card').within(() => {
          cy.contains('h2', 'mathematical clothes').should('exist')
          cy.contains('a', 'Change name').click()
        })
        cy.get('input[id="key-name"]')
          .clear({ force: true })
          .type(NEW_API_KEY_NAME)
        cy.contains('button', 'Continue').click()
        cy.url().should('include', `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
        cy.contains('h1', 'Test API keys').should('exist')
      })
    })
  })

  describe('for a non-admin user', () => {
    beforeEach(() => {
      setupStubs('view-only')
    })

    it('should return forbidden when visiting the url directly', () => {
      cy.request({
        url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403)
      })
    })

    it('should not show API keys link in the navigation panel', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings`)
      cy.get('#settings-navigation-api-keys').should('not.exist')
    })

    it('should return forbidden when visiting the create api key url directly', () => {
      cy.request({
        url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys/create`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403)
      })
    })
  })
})
