const userStubs = require('@test/cypress/stubs/user-stubs')
const ROLES = require('@test/fixtures/roles.fixtures')
const gatewayAccountStubs = require('@test/cypress/stubs/gateway-account-stubs')
const { WORLDPAY } = require('@models/constants/payment-providers')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service456def'
const SERVICE_NAME = {
  en: 'McDuck Enterprises', cy: 'Mentrau McDuck'
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
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, LIVE_ACCOUNT_TYPE, {
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      type: LIVE_ACCOUNT_TYPE,
      payment_provider: WORLDPAY,
      provider_switch_enabled: opts.providerSwitchEnabled || false
    }),
    ...additionalStubs])
}

describe('Card types setting', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('For a non-admin', () => {
    beforeEach(() => {
      setStubs({
        role: 'view-and-refund'
      }, [
        gatewayAccountStubs.getCardTypesSuccess(),
        gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          accountType: LIVE_ACCOUNT_TYPE
        })
      ])
      cy.visit(CARD_TYPES_SETTINGS_URL)
    })
    describe('the settings nav', () => {
      checkSettingsNavigation()
    })
    describe('the page', () => {
      checkTitleAndHeading()
      it('should show the card types in relevant sections', () => {
        const expectedHeadings = [
          'Enabled debit cards',
          'Not enabled debit cards',
          'Enabled credit cards',
          'Not enabled credit cards'
        ]

        const expectedCards = [
          ['Visa debit', 'Mastercard debit'],
          ['Maestro'],
          ['Mastercard credit', 'Visa credit', 'American Express'],
          ['Discover', 'Diners Club', 'JCB', 'Union Pay']
        ]

        cy.get('div.service-settings-pane h2')
          .should('have.length', 4)
          .each(($h2, index) => {
            cy.wrap($h2).should('contain.text', expectedHeadings[index])

            cy.wrap($h2)
              .next('dl')
              .should('exist')
              .then($dl => {
                expectedCards[index].forEach(card => {
                  cy.wrap($dl).should('contain.text', card)
                })
              })
          })
      })
      it('should show a banner explaining that only admins can update the setting', () => {
        cy.get('.govuk-inset-text')
          .should('contain.text', 'You don’t have permission to manage settings.')
      })
    })
  })
  describe('for an admin', () => {
    beforeEach(() => {
      setStubs({}, [
        gatewayAccountStubs.getCardTypesSuccess(),
        gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          accountType: LIVE_ACCOUNT_TYPE
        }),
        gatewayAccountStubs.postAcceptedCardTypesByServiceExternalIdAndAccountType({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          accountType: LIVE_ACCOUNT_TYPE
        }),
        gatewayAccountStubs.getAcceptedCardTypesByServiceExternalIdAndAccountType({
          serviceExternalId: SERVICE_EXTERNAL_ID,
          accountType: LIVE_ACCOUNT_TYPE,
          toggleAmex: true
        })
      ])
      cy.visit(CARD_TYPES_SETTINGS_URL)
    })
    describe('the settings nav', () => {
      checkSettingsNavigation()
    })
    describe('the page', () => {
      checkTitleAndHeading()
      it('should show the all card types as toggle-able checkboxes', () => {
        cy.get('div.service-settings-pane input[type="checkbox"]').should('have.length', 10)
        const expectedHeadings = [
          'Debit cards',
          'Credit cards'
        ]
        cy.get('div.service-settings-pane legend')
          .should('have.length', 2)
          .each(($legend, index) => {
            cy.wrap($legend).should('contain.text', expectedHeadings[index])
          })
      })
      it('should update the selected card types on submit', () => {
        cy.get('div.service-settings-pane')
          .find('input[type="checkbox"]')
          .next()
          .contains('American Express')
          .prev()
          .should('be.checked')
          .click()
          .should('not.be.checked')

        cy.get('.system-messages')
          .should('not.exist')
        cy.get('div.service-settings-pane')
          .find('button[type="submit"]')
          .click()
        cy.get('.system-messages')
          .should('exist')
          .should('contain.text', 'Accepted card types have been updated')
      })
    })
  })
})

function checkTitleAndHeading () {
  it('should have the correct title and heading', () => {
    cy.title().should('eq', 'Card types - Settings - McDuck Enterprises - GOV.UK Pay')
    cy.get('h1').should('have.text', 'Card types')
  })
}

function checkSettingsNavigation () {
  it('should show active card types link', () => {
    cy.get('.service-settings-nav')
      .find('li')
      .contains('Card types')
      .then(li => {
        cy.wrap(li)
          .should('have.attr', 'href', CARD_TYPES_SETTINGS_URL)
          .parent().should('have.class', 'service-settings-nav__li--active')
      })
  })
}
