const userStubs = require('../../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../../stubs/gateway-account-stubs')
const inviteStubs = require('../../../../stubs/invite-stubs')

const ADMIN_USER_ID = 'admin-user-id'
const VIEW_ONLY_USER_ID = 'view-only-user-id'
const SERVICE_EXTERNAL_ID = 'service456def'
const TEST_ACCOUNT_TYPE = 'test'
const TEST_GATEWAY_ACCOUNT_ID = 10
const TEAM_MEMBERS_SETTINGS_URL = `/service/${SERVICE_EXTERNAL_ID}/account/${TEST_ACCOUNT_TYPE}/settings/team-members`

const setStubs = (opts = {}, additionalStubs = []) => {
  const adminUserStubOpts = userStubs.getUserWithServiceRoleStubOpts(ADMIN_USER_ID, 'admin-user@example.com', SERVICE_EXTERNAL_ID, 'admin')
  const viewOnlyUserStubOpts = userStubs.getUserWithServiceRoleStubOpts(VIEW_ONLY_USER_ID, 'view-only-user@example.com', SERVICE_EXTERNAL_ID, 'view-only')

  cy.task('setupStubs', [
    userStubs.getServiceUsersSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      users: [adminUserStubOpts, viewOnlyUserStubOpts]
    }),
    userStubs.getUserSuccess({
      userExternalId: VIEW_ONLY_USER_ID,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      email: 'view-only-user@example.com'
    }),
    userStubs.getUserSuccess({
      userExternalId: ADMIN_USER_ID,
      gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
      serviceName: { en: 'My cool service' },
      serviceExternalId: SERVICE_EXTERNAL_ID,
      role: { name: 'admin' },
      features: 'degatewayaccountification'// TODO remove features once simplified accounts are live
    }),
    inviteStubs.getInvitedUsersSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      invites: []
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, TEST_ACCOUNT_TYPE, { gateway_account_id: TEST_GATEWAY_ACCOUNT_ID }),
    ...additionalStubs
  ])
}

describe('Team members settings', () => {
  describe('For an admin user', () => {
    beforeEach(() => {
      setStubs({})
      cy.setEncryptedCookies(ADMIN_USER_ID)
      cy.visit(TEAM_MEMBERS_SETTINGS_URL)
      cy.get('#team-members-view-only-list').find('dl').first().find('a').contains('Remove').click()
    })

    it('should show the show the correct heading, title and form with correct elements', () => {
      cy.get('h1').should('contain', 'Are you sure you want to remove view-only-user@example.com?')
      cy.title().should('eq', 'Remove team member - Settings - My cool service - GOV.UK Pay')
      cy.get('input[type="radio"][value="yes"]').should('not.be.checked')
      cy.get('input[type="radio"][value="no"]').should('not.be.checked')
      cy.get('button').should('contain.text', 'Save changes')
    })

    it('should show validation error if button clicked without selecting yes or no', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button').contains('Save changes').click()
      cy.get('.govuk-error-summary').should('contain.text', 'Confirm if you want to remove view-only-user@example.com')
      cy.get('#confirm-remove-user-error').should('contain.text', 'Confirm if you want to remove view-only-user@example.com')
    })

    it('should return to team members page and not show user removed notification banner when user selects no and saves changes', () => {
      cy.get('input[type="radio"][value="no"]').click()
      cy.get('button').contains('Save changes').click()
      cy.get('h1').should('contain', 'Team members')
      cy.title().should('eq', 'Team members - Settings - My cool service - GOV.UK Pay')
      cy.get('[data-module=govuk-notification-banner]').should('not.exist')
    })

    it('should return to team members page and show notification banner when user selects yes and saves changes', () => {
      cy.get('input[type="radio"][value="yes"]').click()
      cy.get('button').contains('Save changes').click()
      cy.get('h1').should('contain', 'Team members')
      cy.title().should('eq', 'Team members - Settings - My cool service - GOV.UK Pay')
      cy.get('[data-module=govuk-notification-banner]').should('contain.text', 'Successfully removed view-only-user@example.com')
    })
  })
})
