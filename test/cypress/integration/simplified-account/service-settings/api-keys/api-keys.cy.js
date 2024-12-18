const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const apiKeysStubs = require('@test/cypress/stubs/api-keys-stubs')
const { Token } = require('@models/Token.class')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const GATEWAY_ACCOUNT_ID = 11
const ACCOUNT_TYPE = 'test'

const setupStubs = (role = 'admin', apiKeys = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[role],
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, { gateway_account_id: GATEWAY_ACCOUNT_ID }),
    apiKeysStubs.getApiKeysForGatewayAccount(GATEWAY_ACCOUNT_ID, apiKeys)
  ])
}

describe('Settings - API keys', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })

  describe('for an admin user', () => {
    describe('when there are no active API keys', () => {
      beforeEach(() => {
        setupStubs()
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
      })
      it('should show appropriate buttons and text', () => {
        cy.get('#api-keys').should('have.text', 'API keys')
        cy.get('.service-settings-pane')
          .find('a')
          .contains('Create a new API key')
          .should('exist')
        cy.get('.service-settings-pane')
          .find('h2')
          .contains('There are no active test API keys')
          .should('exist')
        cy.get('.service-settings-pane')
          .find('a')
          .contains('Show revoked API keys')
          .should('exist')
      })
    })

    describe('when there are active API keys', () => {
      const apiKeys = [
        new Token().withCreatedBy('system generated').withDescription('description').withIssuedDate('12 Dec 2024'),
        new Token().withCreatedBy('algae bra').withDescription('mathematical clothes').withIssuedDate('10 Dec 2024').withLastUsed('10 Dec 2024')
      ]
      beforeEach(() => {
        setupStubs('admin', apiKeys)
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`)
      })
      it('should show appropriate buttons and text', () => {
        cy.get('#api-keys').should('have.text', 'API keys')
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
          .should('exist')
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
                    .and('have.attr', 'href', '#')
                })

              cy.get('.govuk-summary-card__action').eq(1)
                .within(() => {
                  cy.get('a')
                    .should('contain.text', 'Revoke')
                    .and('have.attr', 'href', '#')
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
                  cy.get('.govuk-summary-list__value').should('contain', token.lastUsed || '')
                })
            })
        }

        verifySummaryCard(0, apiKeys[0])
        verifySummaryCard(1, apiKeys[1])
      })
    })
  })

  describe('for a non-admin user', () => {
    beforeEach(() => {
      setupStubs('view-only')
    })
    it('should return forbidden when visiting the url directly', () => {
      cy.request({
        url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/api-keys`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(403)
      })
    })

    it('should not show API keys link in the navigation panel', () => {
      cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings`)
      cy.get('#api-keys').should('not.exist')
    })
  })
})
