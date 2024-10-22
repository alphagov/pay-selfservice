const userStubs = require('../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../stubs/gateway-account-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const EMAIL_NOTIFICATIONS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`
const GATEWAY_ACCOUNT_ID = 11
const ADMIN_ROLE = {
  description: 'Administrator',
  name: 'admin',
  permissions: [
    {
      description: 'Viewtransactionslist',
      name: 'transactions:read'
    }
  ]
}
const NON_ADMIN_ROLE = {
  description: 'View only',
  name: 'view-only',
  permissions: [
    {
      description: 'Viewtransactionslist',
      name: 'transactions:read'
    }
  ]
}

const setupStubs = (role) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, 'test', { gateway_account_id: GATEWAY_ACCOUNT_ID })
  ])
}

describe('email notifications settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('landing page', () => {
    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs(ADMIN_ROLE)
        cy.visit(EMAIL_NOTIFICATIONS_URL)
      })

      it('should show the correct heading and title', () => {
        cy.get('h1').should('contain', 'Email notifications')
        cy.title().should('eq', 'Settings - Email notifications')
      })

      it('should show links to change email settings', () => {
        cy.get('.govuk-summary-list').within(() => {
          cy.get('.govuk-summary-list__key').eq(0).should('contain', 'Collect email addresses')
          cy.get('.govuk-summary-list__value').eq(0).should('contain', 'On (mandatory)')
          cy.get('.govuk-summary-list__actions a').eq(0).should('contain', 'Change')
          cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Payment confirmation emails')
          cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(1).should('contain', 'Change')
          cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Refund emails')
          cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(2).should('contain', 'Change')
        })
      })
    })

    describe('for a non admin user', () => {
      beforeEach(() => {
        setupStubs(NON_ADMIN_ROLE)
        cy.visit(EMAIL_NOTIFICATIONS_URL)
      })
      it('should not show links to change email settings', () => {
        cy.get('.govuk-summary-list').within(() => {
          cy.get('.govuk-summary-list__key').eq(0).should('contain', 'Collect email addresses')
          cy.get('.govuk-summary-list__value').eq(0).should('contain', 'On (mandatory)')
          cy.get('.govuk-summary-list__actions a').eq(0).should('not.contain', 'Change')
          cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Payment confirmation emails')
          cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(1).should('not.contain', 'Change')
          cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Refund emails')
          cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(2).should('not.contain', 'Change')
        })
      })

      it('should show the permissions banner', () => {
        cy.get('.govuk-inset-text').should('contain',
          'You don’t have permission to manage settings. Contact your service admin if you would like to manage 3D Secure')
      })
    })
  })
})
