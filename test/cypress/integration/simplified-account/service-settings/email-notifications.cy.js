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
    },
    {
      description: 'Viewemailnotificationstemplate',
      name: 'email-notification-template:read'
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
const ACCOUNT_TYPE = 'test'

const setupStubs = (role = ADMIN_ROLE) => {
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, { gateway_account_id: GATEWAY_ACCOUNT_ID }),
    gatewayAccountStubs.patchAccountEmailCollectionModeSuccessByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'OFF')
  ])
}

describe('email notifications settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('email notifications settings page', () => {
    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs()
        cy.visit(EMAIL_NOTIFICATIONS_URL)
      })

      it('should show the correct heading and title', () => {
        cy.get('h1').should('contain', 'Email notifications')
        cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
      })

      it('should show links to change email settings', () => {
        cy.get('.govuk-summary-list').within(() => {
          cy.get('.govuk-summary-list__key').eq(0).should('contain', 'Collect email addresses')
          cy.get('.govuk-summary-list__value').eq(0).should('contain', 'On (mandatory)')
          cy.get('.govuk-summary-list__actions a').eq(0).should('contain', 'Change')
          cy.get('.govuk-summary-list__actions a.govuk-link').eq(0).should('have.attr', 'href')
            .and('contain', `/account/${ACCOUNT_TYPE}/settings/email-notifications/collection-settings`)

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

  describe('edit collect email mode', () => {
    beforeEach(() => {
      setupStubs()
      cy.visit(EMAIL_NOTIFICATIONS_URL)
      cy.get('.govuk-summary-list').within(() => {
        cy.get('.govuk-summary-list__actions a').eq(0).click()
      })
    })

    it('should navigate to the collect email mode page', () => {
      cy.title().should('contains', 'Settings - Email notifications')
      cy.url().should('include', '/settings/email-notifications/collection-settings')
      cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')
      cy.get('.govuk-radios').within(() => {
        cy.get('.govuk-radios__item').eq(0).should('contain', 'Yes – as a mandatory field')
        cy.get('.govuk-radios__item').eq(1).should('contain', 'Yes – as an optional field')
        cy.get('.govuk-radios__item').eq(2).should('contain', 'No')
      })
    })

    it.only('should navigate to the email notifications landing page after "Save changes" is clicked', () => {
      cy.get('input[type="radio"][value="OFF"]').check()
      cy.get('.govuk-button').contains('Save changes').click()
      cy.get('h1').should('contain', 'Email notifications')
      cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
    })

    it('should navigate to the email notifications landing page after "Back" is clicked', () => {
      cy.get('.govuk-back-link').click()
      cy.get('h1').should('contain', 'Email notifications')
      cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
    })
  })
})
