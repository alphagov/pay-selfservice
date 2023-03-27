'use strict'

const userStubs = require('../../stubs/user-stubs')
const inviteStubs = require('../../stubs/invite-stubs')

const SERVICE_EXTERNAL_ID = 'service_abc_123'
const AUTHENTICATED_USER_ID = 'authenticated-user-id'
const EDITING_USER_ID = 'user-we-are-editing-id'

const authenticatedUserStubOpts = {
  userExternalId: AUTHENTICATED_USER_ID,
  email: 'logged-in-user@example.com',
  serviceExternalId: SERVICE_EXTERNAL_ID,
  role: { name: 'admin' }
}
const userWeAreEditingStubOpts = {
  userExternalId: EDITING_USER_ID,
  email: 'other-user@example.com',
  serviceExternalId: SERVICE_EXTERNAL_ID,
  role: { name: 'admin' }
}

describe('Edit service user permissions', () => {
  it('should be able to update a team members permissions', () => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess(authenticatedUserStubOpts),
      userStubs.getUserSuccess(userWeAreEditingStubOpts),
      userStubs.getServiceUsersSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        users: [authenticatedUserStubOpts, userWeAreEditingStubOpts]
      }),
      inviteStubs.getInvitedUsersSuccess({ serviceExternalId: SERVICE_EXTERNAL_ID, invites: [] }),
      userStubs.putUpdateServiceRoleSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        userExternalId: EDITING_USER_ID,
        role: 'view-and-refund'
      })
    ])

    cy.setEncryptedCookies(AUTHENTICATED_USER_ID)

    cy.visit(`/service/${SERVICE_EXTERNAL_ID}/team-members`)

    cy.get('#team-members-admin-list').find('tr').first().find('td').first().find('a').contains('logged-in-user@example.com (you)')
    cy.get('#team-members-admin-list').find('tr').eq(1).find('td').first().find('a').contains('other-user@example.com')

    cy.get('a').contains('other-user@example.com').click()

    cy.get('h1').contains('Details for other-user@example.com')
    cy.get('table').find('tr').first().find('td').first().contains('other-user@example.com')
    cy.get('table').find('tr').eq(1).find('td').first().contains('Administrator')
    cy.get('table').find('tr').eq(1).find('td').eq(1).find('a').contains('Edit permissions')

    cy.get('a').contains('Edit permissions').click()
    cy.get('#role-admin-input').should('exist').should('have.attr', 'checked')

    cy.get('#role-view-and-refund-input').click()
    cy.get('button').contains('Save changes').click()
    cy.get('.govuk-notification-banner--success').contains('Permissions have been updated')
  })
})
