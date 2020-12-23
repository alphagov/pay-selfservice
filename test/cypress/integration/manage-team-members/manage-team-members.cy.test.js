'use strict'

const { getUserWithServiceRoleStubOpts, getUserSuccess, getServiceUsersSuccess } = require('../../stubs/user-stubs')
const inviteStubs = require('../../stubs/invite-stubs')

const SERVICE_EXTERNAL_ID = 'service_abc_123'
const AUTHENTICATED_USER_ID = 'authenticated-user-id'

describe('Manage team members page', () => {
  beforeEach(() => {
    const authenticatedUserStubOpts = getUserWithServiceRoleStubOpts(AUTHENTICATED_USER_ID, 'logged-in-user@example.com', SERVICE_EXTERNAL_ID, 'admin')
    const adminUserStubOpts = getUserWithServiceRoleStubOpts('admin-user-id', 'admin-user@example.com', SERVICE_EXTERNAL_ID, 'admin')
    const viewOnlyUserStubOpts = getUserWithServiceRoleStubOpts('view-only-user-id', 'view-only-user@example.com', SERVICE_EXTERNAL_ID, 'view-only')
    const viewAndRefundUserStubOpts = getUserWithServiceRoleStubOpts('view-and-refund-user-id', 'view-and-refund-user@example.com', SERVICE_EXTERNAL_ID, 'view-and-refund')

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
      getUserSuccess(authenticatedUserStubOpts),
      getServiceUsersSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        users: [authenticatedUserStubOpts, adminUserStubOpts, viewOnlyUserStubOpts, viewAndRefundUserStubOpts]
      }),
      inviteStubs.getInvitedUsersSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        invites: invites
      })
    ])
  })

  it('should display the manage team members page with users in correct categories', () => {
    cy.setEncryptedCookies(AUTHENTICATED_USER_ID, 1)

    cy.visit(`/service/${SERVICE_EXTERNAL_ID}`)

    cy.get('#team-members-admin-list').find('tr').first().find('td').first().find('a').contains('logged-in-user@example.com (you)')
    cy.get('#team-members-admin-list').find('tr').eq(1).find('td').first().find('a').contains('admin-user@example.com')
    cy.get('#team-members-view-and-refund-list').find('tr').first().find('td').first().find('a').contains('view-and-refund-user@example.com')
    cy.get('#team-members-view-only-list').find('tr').first().find('td').first().find('a').contains('view-only-user@example.com')

    cy.get('#invited-team-members-admin-list').find('tr').first().find('td').contains('invited-admin-user@example.com')
    cy.get('#invited-team-members-view-and-refund-list').find('tr').first().find('td').contains('invited-view-and-refund-user@example.com')
    cy.get('#invited-team-members-view-only-list').find('tr').first().find('td').contains('invited-view-only-user@example.com')
  })
})
