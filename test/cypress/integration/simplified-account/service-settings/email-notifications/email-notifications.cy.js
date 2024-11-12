const userStubs = require('../../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../../stubs/gateway-account-stubs')

const USER_EXTERNAL_ID = 'user-123-abc'
const SERVICE_EXTERNAL_ID = 'service-456-def'
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
    },
    {
      description: 'Turnemailnotificationson/off',
      name: 'email-notification-toggle:update'
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

const setupStubs = (role = ADMIN_ROLE, emailCollectionMode = 'MANDATORY') => {
  let opts = { gateway_account_id: GATEWAY_ACCOUNT_ID }
  if (emailCollectionMode) {
    opts = { ...opts, ...{ email_collection_mode: emailCollectionMode } }
  }
  cy.task('setupStubs', [
    userStubs.getUserSuccess({
      userExternalId: USER_EXTERNAL_ID,
      gatewayAccountId: GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role,
      features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, opts)
  ])
}

describe('Email notifications settings', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(USER_EXTERNAL_ID)
  })
  describe('Settings landing page', () => {
    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs()
      })

      it('should show the correct heading and title', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
        cy.get('h1').should('contain', 'Email notifications')
        cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
      })

      it('should show links to change email settings', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
        cy.get('.govuk-summary-list').within(() => {
          cy.get('.govuk-summary-list__key').eq(0).should('contain', 'Ask users for their email address')
          cy.get('.govuk-summary-list__value').eq(0).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(0).should('contain', 'Change')
          cy.get('.govuk-summary-list__actions a.govuk-link').eq(0).should('have.attr', 'href',
            `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/email-collection-mode`)
          cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Send payment confirmation emails')
          cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(1).should('contain', 'Change')

          cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Send refund emails')
          cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(2).should('contain', 'Change')
          cy.get('.govuk-summary-list__actions a.govuk-link').eq(2).should('have.attr', 'href',
            `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/refund-email-toggle`)
        })
      })
    })

    describe('for a non admin user', () => {
      beforeEach(() => {
        setupStubs(NON_ADMIN_ROLE)
      })
      it('should not show links to change email settings', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
        cy.get('.govuk-summary-list').within(() => {
          cy.get('.govuk-summary-list__key').eq(0).should('contain', 'Ask users for their email address')
          cy.get('.govuk-summary-list__value').eq(0).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(0).should('not.contain', 'Change')
          cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Send payment confirmation emails')
          cy.get('.govuk-summary-list__value').eq(1).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(1).should('not.contain', 'Change')
          cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Send refund emails')
          cy.get('.govuk-summary-list__value').eq(2).should('contain', 'On')
          cy.get('.govuk-summary-list__actions a').eq(2).should('not.contain', 'Change')
        })
      })

      it('should show the permissions banner', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
        cy.get('.govuk-inset-text').should('contain',
          'You don’t have permission to manage settings. Contact your service admin if you would like to manage 3D Secure')
      })
    })
  })

  describe('Edit collect email mode', () => {
    beforeEach(() => {
      setupStubs()
      cy.task('setupStubs', [
        gatewayAccountStubs.patchAccountEmailCollectionModeSuccessByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'OFF')
      ])
      cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
      cy.get('.govuk-summary-list').within(() => {
        cy.get('.govuk-summary-list__actions a').eq(0).click()
      })
    })

    it('should navigate to the collect email mode page', () => {
      cy.title().should('contains', 'Settings - Email notifications')
      cy.url().should('include', '/settings/email-notifications/email-collection-mode')
      cy.get('.govuk-fieldset__heading').first().should('contain', 'Ask users for their email address')
      cy.get('.govuk-radios').within(() => {
        cy.get('.govuk-radios__item').eq(0).should('contain', 'On – as a mandatory field')
        cy.get('.govuk-radios__item').eq(1).should('contain', 'On – as an optional field')
        cy.get('.govuk-radios__item').eq(2).should('contain', 'Off')
      })
    })

    it('should navigate to the email notifications landing page after "Save changes" is clicked', () => {
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

  describe('When email collection mode is OFF', () => {
    beforeEach(() => {
      setupStubs(ADMIN_ROLE, 'OFF')
    })
    it('there should be no "Change" link on the Payment confirmation emails and Refund emails rows', () => {
      cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)

      cy.get('.govuk-summary-list').within(() => {
        cy.get('.govuk-summary-list__key').eq(0).should('contain', 'Ask users for their email address')
        cy.get('.govuk-summary-list__value').eq(0).should('contain', 'Off')
        cy.get('.govuk-summary-list__actions a').eq(0).should('contain', 'Change')
        cy.get('.govuk-summary-list__actions a.govuk-link').eq(0).should('have.attr', 'href',
          `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/email-collection-mode`)

        // Verify there's only one change link. It's currently not possible to verify there is no 'Change' link on the 1st and 2nd row
        cy.get('a.govuk-link').contains('Change').should('have.length', 1)

        cy.get('.govuk-summary-list__key').eq(1).should('contain', 'Send payment confirmation emails')
        cy.get('.govuk-summary-list__value').eq(1).should('contain', 'Off (not asking users for their email address)')

        cy.get('.govuk-summary-list__key').eq(2).should('contain', 'Send refund emails')
        cy.get('.govuk-summary-list__value').eq(2).should('contain', 'Off (not asking users for their email address)')
      })
    })

    it('should return 404 when navigating directly to the refund email settings page', () => {
      cy.request({
        url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/refund-email-toggle`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })

    it('should return 404 when navigating directly to the payment confirmation email settings page', () => {
      cy.request({
        url: `/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/payment-confirmation-email-toggle`,
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })
  })

  describe('Payment confirmation email settings', () => {
    describe('When email collection mode is MANDATORY or OPTIONAL', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          gatewayAccountStubs.setPaymentConfirmationEmailEnabledByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'false')
        ])
      })

      it('should navigate to the payment confirmation email toggle page', () => {
        ['MANDATORY', 'OPTIONAL'].forEach(mode => {
          setupStubs(ADMIN_ROLE, mode)
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
          cy.get('.govuk-summary-list').within(() => {
            cy.get('.govuk-summary-list__actions a').eq(1).click()
          })

          cy.title().should('contains', 'Settings - Email notifications')
          cy.url().should('include', '/settings/email-notifications/payment-confirmation-email-toggle')
          cy.get('.govuk-fieldset__heading').first().should('contain', 'Send payment confirmation emails')

          cy.get('.govuk-radios').within(() => {
            cy.get('.govuk-radios__item').eq(0).should('contain', 'On')
            cy.get('.govuk-radios__item').eq(1).should('contain', 'Off')
          })

          // navigate back to email notifications page
          cy.get('input[type="radio"][value="false"]').check()
          cy.get('.govuk-button').contains('Save changes').click()
          cy.get('h1').should('contain', 'Email notifications')
          cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
        })
      })
    })
  })

  describe('Refund email settings', () => {
    describe('When email collection mode is MANDATORY or OPTIONAL', () => {
      beforeEach(() => {
        cy.task('setupStubs', [
          gatewayAccountStubs.setRefundEmailEnabledByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'false')
        ])
      })

      it('should navigate to the refund email toggle page', () => {
        ['MANDATORY', 'OPTIONAL'].forEach(mode => {
          setupStubs(ADMIN_ROLE, mode)
          cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications`)
          cy.get('.govuk-summary-list').within(() => {
            cy.get('.govuk-summary-list__actions a').eq(2).click()
          })

          cy.title().should('contains', 'Settings - Email notifications')
          cy.url().should('include', '/settings/email-notifications/refund-email-toggle')
          cy.get('.govuk-fieldset__heading').first().should('contain', 'Send refund emails')

          cy.get('.govuk-radios').within(() => {
            cy.get('.govuk-radios__item').eq(0).should('contain', 'On')
            cy.get('.govuk-radios__item').eq(1).should('contain', 'Off')
          })

          // navigate back to email notifications page
          cy.get('input[type="radio"][value="false"]').check()
          cy.get('.govuk-button').contains('Save changes').click()
          cy.get('h1').should('contain', 'Email notifications')
          cy.title().should('eq', 'Settings - Email notifications - GOV.UK Pay')
        })
      })
    })
  })

  describe('Email templates', () => {
    describe('for an admin user', () => {
      beforeEach(() => {
        setupStubs()
      })
      it('should show relevant tabs and Add Custom Paragraph link', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/templates`)
        cy.get('#tab_confirmation-html').should('have.attr', 'href', '#confirmation-html')
        cy.get('#add-custom-paragraph-link').should('have.attr', 'href', '#') // TODO verify actual href
        cy.get('#tab_refund-html').eq(0).should('have.attr', 'href', '#refund-html')
      })
    })

    describe('for a non-admin user', () => {
      beforeEach(() => {
        setupStubs(NON_ADMIN_ROLE)
      })
      it('should show relevant tabs only', () => {
        cy.visit(`/simplified/service/${SERVICE_EXTERNAL_ID}/account/test/settings/email-notifications/templates`)
        cy.get('#tab_confirmation-html').should('have.attr', 'href', '#confirmation-html')
        cy.get('#add-custom-paragraph-link').should('have.attr', 'disabled', 'disabled')
        cy.get('#tab_refund-html').eq(0).should('have.attr', 'href', '#refund-html')
      })
    })
  })
})
