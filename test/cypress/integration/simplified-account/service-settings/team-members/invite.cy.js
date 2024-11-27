const userStubs = require('../../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../../stubs/gateway-account-stubs')
const inviteStubs = require('../../../../stubs/invite-stubs')

const ADMIN_USER_ID = 'admin-user-id'
const VIEW_ONLY_USER_ID = 'view-only-user-id'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const TEST_ACCOUNT_TYPE = 'test'
const TEST_GATEWAY_ACCOUNT_ID = 10
const TEAM_MEMBERS_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${TEST_ACCOUNT_TYPE}/settings/team-members`

const setStubs = (opts = {}, additionalStubs = []) => {
  const adminUserStubOpts = userStubs.getUserWithServiceRoleStubOpts(ADMIN_USER_ID, 'admin-user@example.com', SERVICE_EXTERNAL_ID, 'admin')

  cy.task('setupStubs', [
    userStubs.getServiceUsersSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      users: [adminUserStubOpts]
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
    inviteStubs.createInviteToJoinService({
      email: 'invited_user@users.gov.uk',
      senderId: ADMIN_USER_ID,
      serviceExternalId: SERVICE_EXTERNAL_ID,
      roleName: 'view-only'
    }, opts.userAlreadyInvited),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, TEST_ACCOUNT_TYPE, { gateway_account_id: TEST_GATEWAY_ACCOUNT_ID }),
    ...additionalStubs
  ])
}

describe('Team members settings', () => {
  describe('Success', () => {
    beforeEach(() => {
      setStubs({})
      cy.setEncryptedCookies(ADMIN_USER_ID)
      cy.visit(TEAM_MEMBERS_SETTINGS_URL)
      cy.get('#invite-team-member-link').click()
    })

    it('should show the show the correct heading, title and form with correct elements', () => {
      cy.get('h1').should('contain', 'Invite a team member')
      cy.title().should('eq', 'Settings - Team members - Invite a team member - GOV.UK Pay')
      cy.get('input[type="radio"][value="admin"]').should('not.be.checked')
      cy.get('input[type="radio"][value="view-and-refund"]').should('not.be.checked')
      cy.get('input[type="radio"][value="view-only"]').should('not.be.checked')
      cy.get('button').should('contain.text', 'Send invitation email')
    })

    it('should show validation error if button clicked without completing the form', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button').contains('Send invitation email').click()
      cy.get('.govuk-error-summary').should('contain.text', 'Select a permission level')
      cy.get('.govuk-error-summary').should('contain.text', 'Enter a valid email address')
      cy.get('#invited-user-email-error').should('contain.text', 'Enter a valid email address')
      cy.get('#invited-user-role-error').should('contain.text', 'Select a permission level')
    })

    it('should show validation error if button clicked without selecting a role', () => {
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button').contains('Send invitation email').click()
      cy.get('.govuk-error-summary').should('contain.text', 'Select a permission level')
      cy.get('.govuk-error-summary').should('contain.text', 'Enter a valid email address')
      cy.get('#invited-user-email-error').should('contain.text', 'Enter a valid email address')
      cy.get('#invited-user-role-error').should('contain.text', 'Select a permission level')
    })

    it('should return to team members page and show notification banner when user completes the form correctly', () => {
      cy.get('input[type="radio"][value="view-only"]').click()
      cy.get('input[type="email"]').type('invited_user@users.gov.uk')
      cy.get('button').contains('Send invitation email').click()
      cy.get('h1').should('contain', 'Team members')
      cy.title().should('eq', 'Settings - Team members - GOV.UK Pay')
      cy.get('[data-module=govuk-notification-banner]').should('contain.text', 'Team member invitation sent to invited_user@users.gov.uk')
    })
  })

  describe('Failure - user already in service or invited by another user', () => {
    beforeEach(() => {
      setStubs({ userAlreadyInvited: true })
      cy.setEncryptedCookies(ADMIN_USER_ID)
      cy.visit(TEAM_MEMBERS_SETTINGS_URL)
      cy.get('#invite-team-member-link').click()
    })

    it('should show error when button clicked', () => {
      cy.get('input[type="radio"][value="view-only"]').click()
      cy.get('input[type="email"]').type('invited_user@users.gov.uk')
      cy.get('.govuk-error-summary').should('not.exist')
      cy.get('button').contains('Send invitation email').click()
      cy.get('.govuk-error-summary').should('contain.text', 'This person has already been invited')
      cy.get('#invited-user-email-error').should('contain.text', 'You cannot send an invitation to invited_user@users.gov.uk because they have received one already, or may be an existing team member')
    })
  })
})
