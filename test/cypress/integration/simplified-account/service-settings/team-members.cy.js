const userStubs = require('../../../stubs/user-stubs')
const gatewayAccountStubs = require('../../../stubs/gateway-account-stubs')
const inviteStubs = require('../../../stubs/invite-stubs')

const ADMIN_USER_ID = 'admin-user-id'
const VIEW_ONLY_USER_ID = 'view-only-user-id'
const SERVICE_EXTERNAL_ID = 'service-456-def'
const TEST_ACCOUNT_TYPE = 'test'
const TEST_GATEWAY_ACCOUNT_ID = 10
const TEAM_MEMBERS_SETTINGS_URL = `/simplified/service/${SERVICE_EXTERNAL_ID}/account/${TEST_ACCOUNT_TYPE}/settings/team-members`

const setStubs = (opts = {}, additionalStubs = []) => {
  // specify three existing team members
  const adminUserStubOpts = userStubs.getUserWithServiceRoleStubOpts(ADMIN_USER_ID, 'admin-user@example.com', SERVICE_EXTERNAL_ID, 'admin')
  const viewOnlyUserStubOpts = userStubs.getUserWithServiceRoleStubOpts(VIEW_ONLY_USER_ID, 'view-only-user@example.com', SERVICE_EXTERNAL_ID, 'view-only')
  const viewAndRefundUserStubOpts = userStubs.getUserWithServiceRoleStubOpts('view-and-refund-user-id', 'view-and-refund-user@example.com', SERVICE_EXTERNAL_ID, 'view-and-refund')

  // specify three invited team members
  const invites = [
    {
      email: 'invited-admin-user@example.com',
      role: 'admin'
    },
    {
      email: 'invited-view-only-user@example.com',
      role: 'view-only'
    },
    {
      email: 'invited-view-and-refund-user@example.com',
      role: 'view-and-refund'
    }
  ]

  cy.task('setupStubs', [
    userStubs.getServiceUsersSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      users: [adminUserStubOpts, viewOnlyUserStubOpts, viewAndRefundUserStubOpts]
    }),
    inviteStubs.getInvitedUsersSuccess({
      serviceExternalId: SERVICE_EXTERNAL_ID,
      invites
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(SERVICE_EXTERNAL_ID, TEST_ACCOUNT_TYPE, { gateway_account_id: TEST_GATEWAY_ACCOUNT_ID }),
    ...additionalStubs

  ])
}

describe('Team members settings', () => {
  describe('For an admin user', () => {
    beforeEach(() => {
      // set an additional stub for authentication of the admin team member
      const currentUserIsAdminStubs = userStubs.getUserSuccess({
        userExternalId: ADMIN_USER_ID,
        gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
        serviceName: { en: 'My cool service' },
        serviceExternalId: SERVICE_EXTERNAL_ID,
        role: { name: 'admin' },
        features: 'degatewayaccountification'// TODO remove features once simplified accounts are live
      })
      setStubs({}, [currentUserIsAdminStubs])
      cy.setEncryptedCookies(ADMIN_USER_ID)
      cy.visit(TEAM_MEMBERS_SETTINGS_URL)
    })

    it('should show the correct heading and title', () => {
      cy.get('h1').should('contain', 'Team members')
      cy.title().should('eq', 'Settings - Team members')
    })

    it('should show the Invite a team member button', () => {
      cy.get('#invite-team-member-link').should('exist')
    })

    it('should show the current team members in the correct order with appropriate links', () => {
      cy.get('#team-members-admin-list').find('dd').first().contains('admin-user@example.com (you)')
      cy.get('#team-members-admin-list').find('dl').first().find('a').contains('View')
      cy.get('#team-members-view-and-refund-list').find('dd').first().contains('view-and-refund-user@example.com')
      cy.get('#team-members-view-and-refund-list').find('dl').first().find('a').first().contains('Change permission')
      cy.get('#team-members-view-and-refund-list').find('dl').first().find('a').contains('Remove')
      cy.get('#team-members-view-only-list').find('dd').first().contains('view-only-user@example.com')
      cy.get('#team-members-view-only-list').find('dl').first().find('a').should('have.length', 2).first().contains('Change permission')
      cy.get('#team-members-view-only-list').find('dl').first().find('a').contains('Remove')
    })

    it('should show the invited team members in the correct order', () => {
      cy.get('#invited-team-members-admin-list').find('dd').contains('invited-admin-user@example.com')
      cy.get('#invited-team-members-view-and-refund-list').find('dd').contains('invited-view-and-refund-user@example.com')
      cy.get('#invited-team-members-view-only-list').find('dd').contains('invited-view-only-user@example.com')
    })
  })

  describe('For a view-only user', () => {
    beforeEach(() => {
      // set an additional stub for authentication of the view-only team member
      const currentUserIsViewOnlyStubs = userStubs.getUserSuccess({
        userExternalId: VIEW_ONLY_USER_ID,
        gatewayAccountId: TEST_GATEWAY_ACCOUNT_ID,
        serviceName: { en: 'My cool service' },
        serviceExternalId: SERVICE_EXTERNAL_ID,
        role: { name: 'view-only' },
        features: 'degatewayaccountification' // TODO remove features once simplified accounts are live
      })
      setStubs({}, [currentUserIsViewOnlyStubs])
      cy.setEncryptedCookies(VIEW_ONLY_USER_ID)
      cy.visit(TEAM_MEMBERS_SETTINGS_URL)
    })

    it('should show the correct heading and title', () => {
      cy.get('h1').should('contain', 'Team members')
      cy.title().should('eq', 'Settings - Team members')
    })

    it('should not show the Invite a team member button', () => {
      cy.get('#invite-team-member-link').should('not.exist')
    })

    it('should show the current team members in the correct order without remove or change permission links', () => {
      cy.get('#team-members-admin-list').find('dd').first().contains('admin-user@example.com')
      cy.get('#team-members-view-and-refund-list').find('dd').first().contains('view-and-refund-user@example.com')
      cy.get('#team-members-view-only-list').find('dd').first().contains('view-only-user@example.com (you)')
    })

    it('should show the invited team members in the correct order', () => {
      cy.get('#invited-team-members-admin-list').find('dd').first().contains('invited-admin-user@example.com')
      cy.get('#invited-team-members-view-and-refund-list').find('dd').first().contains('invited-view-and-refund-user@example.com')
      cy.get('#invited-team-members-view-only-list').find('dd').first().contains('invited-view-only-user@example.com')
    })
  })
})
