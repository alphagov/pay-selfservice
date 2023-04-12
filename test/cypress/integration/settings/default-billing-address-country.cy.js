const userStubs = require('../../stubs/user-stubs')
const serviceStubs = require('../../stubs/service-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const serviceExternalId = 'a-service-external-id'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-gateway-account-external-id'

function getUserAndGatewayAccountStubs (defaultBillingAddressCountry) {
  return [
    userStubs.getUserSuccess({
      userExternalId,
      serviceExternalId,
      gatewayAccountId,
      defaultBillingAddressCountry
    }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId })
  ]
}

describe('Default billing address country', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('User is an admin', () => {
    it('should show default country as None and allow updating', () => {
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(null),
        serviceStubs.patchUpdateDefaultBillingAddressCountrySuccess({
          serviceExternalId,
          gatewayAccountId,
          country: 'GB'
        })
      ])

      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.percySnapshot()

      cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Default billing address country')
      cy.get('.govuk-summary-list__value').eq(1).should('contain', 'None')

      cy.get('.govuk-summary-list__actions').eq(1).contains('Change').click()

      cy.get('input[type="radio"]').should('have.length', 2)
      cy.get('input[value="on"]').should('not.be.checked')
      cy.get('input[value="off"]').should('be.checked')

      cy.get('input[value="on"]').click()
      cy.get('.govuk-button').contains('Save changes').click()

      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/settings`)
      })

      it('should show default billing address country as "United Kingdom"', () => {
        cy.task('setupStubs', [
          ...getUserAndGatewayAccountStubs('GB'),
        ])

        cy.visit(`/account/${gatewayAccountExternalId}/settings`)
        cy.percySnapshot()
        cy.get('.govuk-notification-banner--success').should('contain', 'United Kingdom as the default billing address: On')

        cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Default billing address country')
        cy.get('.govuk-summary-list__value').eq(1).should('contain', 'United Kingdom')
      })
    })
  })

  describe('User is view only', () => {
    it('should have settings page disabled', () => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({
          userExternalId,
          gatewayAccountId,
          role: {
            permissions: [
              { name: 'transactions-details:read' },
              { name: 'toggle-billing-address:read' }
            ]
          }
        }),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId })
      ])

      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.percySnapshot()
      cy.get('.govuk-summary-list__actions').eq(1).contains('View').click()
      cy.get('.pay-info-warning-box').contains('You don’t have permission')
      cy.get('input[value="on"]').should('be.disabled')
      cy.get('input[value="off"]').should('be.disabled')
      cy.get('.govuk-button').should('be.disabled')
    })
  })
})
