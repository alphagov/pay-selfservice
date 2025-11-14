const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { WORLDPAY } = require('@models/constants/payment-providers')
const checkSettingsNavigation = require('@test/cypress/integration/simplified-account/service-settings/helpers/check-settings-nav')
const {
  WORLDPAY_CREDENTIAL_IN_CREATED_STATE,
  WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE,
} = require('@test/fixtures/credentials.fixtures')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises',
  cy: 'Mentrau McDuck',
}
const LIVE_ACCOUNT_TYPE = 'live'
const GATEWAY_ACCOUNT_ID = 10

const CARD_TYPES_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${LIVE_ACCOUNT_TYPE}/settings/card-types`

const setStubs = (opts = {}, additionalStubs = []) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: SERVICE_NAME,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: ROLES[opts.role || 'admin'],
      goLiveStage: opts.goLiveStage,
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: WORLDPAY,
      provider_switch_enabled: opts.providerSwitchEnabled || false,
      gateway_account_credentials: opts.credentials,
    }),
    ...additionalStubs,
  ])
}

describe('Card types setting', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('For a non-admin', () => {
    beforeEach(() => {
      setStubs(
        {
          role: 'view-and-refund',
          goLiveStage: 'LIVE',
          credentials: [WORLDPAY_CREDENTIAL_IN_CREATED_STATE],
        },
        [
          gatewayAccountStubs.getCardTypesSuccess(),
          gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
          }),
        ]
      )
      cy.visit(CARD_TYPES_SETTINGS_URL)
    })
    describe('the settings nav', () => {
      it('should show active "Card types" link in the setting navigation', () => {
        checkSettingsNavigation('Card types', CARD_TYPES_SETTINGS_URL)
      })
    })
    describe('the page', () => {
      checkTitleAndHeading()
      it('should show the card types in relevant sections', () => {
        const expectedHeadings = [
          'Enabled debit cards',
          'Not enabled debit cards',
          'Enabled credit cards',
          'Not enabled credit cards',
        ]

        const expectedCards = [
          ['Visa debit', 'Mastercard debit'],
          ['Maestro'],
          ['Mastercard credit', 'Visa credit', 'American Express'],
          ['Discover', 'Diners Club', 'JCB', 'Union Pay'],
        ]

        cy.get('div.service-pane h2')
          .should('have.length', 4)
          .each(($h2, index) => {
            cy.wrap($h2).should('contain.text', expectedHeadings[index])

            cy.wrap($h2)
              .next('dl')
              .should('exist')
              .then(($dl) => {
                expectedCards[index].forEach((card) => {
                  cy.wrap($dl).should('contain.text', card)
                })
              })
          })
      })
      it('should show a banner explaining that only admins can update the setting', () => {
        cy.get('.govuk-inset-text').should('contain.text', 'You don’t have permission to manage settings.')
      })
    })
  })
  describe('for an admin', () => {
    beforeEach(() => {
      setStubs(
        {
          goLiveStage: 'LIVE',
          credentials: [WORLDPAY_CREDENTIAL_IN_ACTIVE_STATE],
        },
        [
          gatewayAccountStubs.getCardTypesSuccess(),
          gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
          }),
          gatewayAccountStubs.postAcceptedCardTypesByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
          }),
          gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
            toggleAmex: true,
          }),
        ]
      )
      cy.visit(CARD_TYPES_SETTINGS_URL)
    })
    describe('the settings nav', () => {
      it('should show active "Card types" link in the setting navigation', () => {
        checkSettingsNavigation('Card types', CARD_TYPES_SETTINGS_URL)
      })
    })
    describe('the page', () => {
      checkTitleAndHeading()
      it('should show the all card types as toggle-able checkboxes', () => {
        cy.get('div.service-pane input[type="checkbox"]').should('have.length', 10)
        const expectedHeadings = ['Debit cards', 'Credit cards']
        cy.get('div.service-pane legend')
          .should('have.length', 2)
          .each(($legend, index) => {
            cy.wrap($legend).should('contain.text', expectedHeadings[index])
          })
      })
      it('should update the selected card types on submit', () => {
        cy.get('div.service-pane')
          .find('input[type="checkbox"]')
          .next()
          .contains('American Express')
          .prev()
          .should('be.checked')
          .click()
          .should('not.be.checked')

        cy.get('.system-messages').should('not.exist')
        cy.get('div.service-pane').find('button[type="submit"]').click()
        cy.get('.system-messages').should('exist').should('contain.text', 'Accepted card types have been updated')
      })
    })
  })

  describe('for an admin in PSP onboarding stage', () => {
    beforeEach(() => {
      setStubs(
        {
          role: 'admin',
          goLiveStage: 'LIVE',
          credentials: [WORLDPAY_CREDENTIAL_IN_CREATED_STATE],
        },
        [
          gatewayAccountStubs.getCardTypesSuccess(),
          gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
            serviceExternalId: SERVICE_EXTERNAL_ID,
            accountType: LIVE_ACCOUNT_TYPE,
          }),
        ]
      )
    })

    it('should show PSP onboarding inset text', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/live/settings/card-types`)

      cy.get('.govuk-inset-text')
        .contains(
          'Finish going live before you can change live settings or you can enter sandbox mode to try out different settings and functionality. '
        )
        .should('exist')
        .within(() => {
          cy.get('a')
            .contains('Finish going live')
            .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/live/settings/worldpay-details`)
          cy.get('a')
            .contains('enter sandbox mode')
            .should('have.attr', 'href', `/service/${SERVICE_EXTERNAL_ID}/account/live/enter-sandbox-mode`)
        })
    })

    it('should show the view-only card types view', () => {
      cy.visit(`/service/${SERVICE_EXTERNAL_ID}/account/live/settings/card-types`)

      const expectedHeadings = [
        'Enabled debit cards',
        'Not enabled debit cards',
        'Enabled credit cards',
        'Not enabled credit cards',
      ]

      const expectedCards = [
        ['Visa debit', 'Mastercard debit'],
        ['Maestro'],
        ['Mastercard credit', 'Visa credit', 'American Express'],
        ['Discover', 'Diners Club', 'JCB', 'Union Pay'],
      ]

      cy.get('div.service-pane h2')
        .should('have.length', 4)
        .each(($h2, index) => {
          cy.wrap($h2).should('contain.text', expectedHeadings[index])

          cy.wrap($h2)
            .next('dl')
            .should('exist')
            .then(($dl) => {
              expectedCards[index].forEach((card) => {
                cy.wrap($dl).should('contain.text', card)
              })
            })
        })
    })
  })
})

function checkTitleAndHeading() {
  it('should have the correct title and heading', () => {
    cy.title().should('eq', 'Card types - Settings - McDuck Enterprises - GOV.UK Pay')
    cy.get('h1').should('have.text', 'Card types')
  })
}
