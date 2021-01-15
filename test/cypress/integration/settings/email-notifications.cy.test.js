const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

const settingsUrl = `/settings`
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceName = 'Test Service'

function setupStubs (role) {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, role }),
    gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId }),
    gatewayAccountStubs.getAccountAuthSuccess({ gatewayAccountId }),
    gatewayAccountStubs.patchConfirmationEmailToggleSuccess({ gatewayAccountId }),
    gatewayAccountStubs.patchRefundEmailToggleSuccess({ gatewayAccountId }),
    gatewayAccountStubs.patchAccountEmailCollectionModeSuccess({ gatewayAccountId })
  ])
}

describe('Settings', () => {
  describe('For an admin user', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      setupStubs()

      cy.visit(settingsUrl)
    })

    describe('Settings default page', () => {
      it(`should have the page title 'Settings - ${serviceName} - GOV.UK Pay'`, () => {
        cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Enter an email address')
        cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On (mandatory)')
        cy.get('.govuk-summary-list__actions a').eq(1).contains('Change enter an email address settings')
        cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Payment confirmation emails')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
        cy.get('.govuk-summary-list__actions a').eq(2).contains('Change payment confirmation emails settings')
        cy.get('.govuk-summary-list__key').eq(3).should('contain', 'Refund emails')
        cy.get('.govuk-summary-list__value').eq(3).should('contain', 'On')
        cy.get('.govuk-summary-list__actions a').eq(3).contains('Change refund emails settings')
      })
    })

    describe('Email notifications home page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        cy.get('#templates-link').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)
        cy.get('#confirmation-email-template').should('contain', 'Confirmation email template')

        // Click the 'Refund email' tab
        cy.get('#refund-tab').click()
        cy.url().should('include', '/email-notifications-refund')
        cy.get('#refund-email-template').should('contain', 'Refund email template')
      })
    })

    describe('Email collection mode page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Access the collection mode page
        cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Enter an email address')
        cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On (mandatory)')
        cy.get('.email-notifications-toggle-collection').contains('Change enter an email address settings').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)
        cy.url().should('include', '/email-settings-collection')

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')

        // Test the save button
        cy.contains('Save changes').click()
        cy.url().should('include', settingsUrl)

        // Access the collection mode page again
        cy.get('.email-notifications-toggle-collection').click()
        // Test the cancel button
        cy.contains('Cancel').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Confirmation email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Access the confirmation toggle page
        cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Payment confirmation emails')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
        cy.get('.email-notifications-toggle-confirmation').contains('Change payment confirmation emails settings').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send payment confirmation emails?')

        cy.contains('Save changes').click()
        cy.url().should('include', settingsUrl)

        // Access the confirmation toggle page again
        cy.get('.email-notifications-toggle-confirmation').click()
        // Test the cancel button
        cy.contains('Cancel').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Refund email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Access the refund toggle page
        cy.get('.govuk-summary-list__key').eq(3).should('contain', 'Refund emails')
        cy.get('.govuk-summary-list__value').eq(3).should('contain', 'On')
        cy.get('.email-notifications-toggle-refund').contains('Change refund emails settings').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send refund emails?')

        cy.contains('Save changes').click()
        cy.url().should('include', settingsUrl)

        // Access the refund toggle page again
        cy.get('.email-notifications-toggle-refund').click()
        // Test the cancel button
        cy.contains('Cancel').click()
        cy.url().should('include', settingsUrl)
      })
    })
  })

  describe('For a read-only user', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      const role = {
        permissions: [
          {
            name: 'email-notification-template:read',
            description: 'Viewemailnotificationstemplate'
          },
          {
            name: 'transactions-details:read',
            description: 'Viewtransactionsdetailsonly'
          }
        ]
      }
      setupStubs(role)

      cy.visit(settingsUrl)
    })

    describe('Email notifications home page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Default notifications page and confirmation email tab contents
        cy.get('#templates-link').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)
        cy.get('#confirmation-email-template').should('contain', 'Confirmation email template')

        // Click the 'Refund email' tab
        cy.get('#refund-tab').click()
        cy.url().should('include', '/email-notifications-refund')
        cy.get('#refund-email-template').should('contain', 'Refund email template')
      })
    })

    describe('Email collection mode page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Access the collection mode page
        cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Enter an email address')
        cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On (mandatory)')
        cy.get('.email-notifications-toggle-collection').contains('View enter an email address settings').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)
        cy.url().should('include', '/email-settings-collection')

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')

        // Test it’s read-only
        cy.get('input[disabled]').should('have.length', 3)
        // Test the back button
        cy.contains('Go back').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Confirmation email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Access the confirmation toggle page
        cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Payment confirmation emails')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
        cy.get('.email-notifications-toggle-confirmation').contains('View payment confirmation emails settings').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send payment confirmation emails?')

        // Test it’s read-only
        cy.get('input[disabled]').should('have.length', 2)
        // Test the back button
        cy.contains('Go back').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Refund email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} Sandbox test - GOV.UK Pay'`, () => {
        // Access the refund toggle page
        cy.get('.govuk-summary-list__key').eq(3).should('contain', 'Refund emails')
        cy.get('.govuk-summary-list__value').eq(3).should('contain', 'On')
        cy.get('.email-notifications-toggle-refund').contains('View refund emails settings').click()
        cy.title().should('eq', `Email notifications - ${serviceName} Sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send refund emails?')

        // Test it’s read-only
        cy.get('input[disabled]').should('have.length', 2)
        // Test the cancel button
        cy.contains('Go back').click()
        cy.url().should('include', settingsUrl)
      })
    })
  })
})
