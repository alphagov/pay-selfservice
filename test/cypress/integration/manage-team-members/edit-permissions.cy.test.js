'use strict'

const userStubs = require('../../utils/user-stubs')
const inviteStubs = require('../../utils/invite-stubs')

const SERVICE_EXTERNAL_ID = 'service_abc_123'
const AUTHENTICATED_USER_ID = 'authenticated-user-id'
const EDITING_USER_ID = 'user-we-are-editing-id'

describe('Edit service user permissions', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session')
    Cypress.Cookies.preserveOnce('gateway_account')

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
    const authenticatedUserSuccess = userStubs.getUserSuccess(userWeAreEditingStubOpts)
    const userWeAreEditingSuccess = userStubs.getUserSuccess(authenticatedUserStubOpts)

    cy.task('setupStubs', [
      userStubs.getUserSuccess(authenticatedUserStubOpts),
      userStubs.getUserSuccess(userWeAreEditingStubOpts),
      userStubs.getServiceUsersSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        users: [userWeAreEditingSuccess.opts, authenticatedUserSuccess.opts]
      }),
      inviteStubs.getInvitedUsersSuccess({ serviceExternalId: SERVICE_EXTERNAL_ID, invites: [] }),
      userStubs.putUpdateServiceRoleSuccess({
        serviceExternalId: SERVICE_EXTERNAL_ID,
        userExternalId: EDITING_USER_ID,
        role: 'view-and-refund'
      })
    ])
  })

  it('should display team members page', () => {
    cy.setEncryptedCookies(AUTHENTICATED_USER_ID, 1)

    cy.visit(`/service/${SERVICE_EXTERNAL_ID}`)

    cy.get('#team-members-admin-list').find('tr').first().find('td').first().find('a').contains('logged-in-user@example.com (you)')
    cy.get('#team-members-admin-list').find('tr').eq(1).find('td').first().find('a').contains('other-user@example.com')
  })

  it('should redirect to team member details page', () => {
    cy.get('a').contains('other-user@example.com').click()

    cy.get('h1').contains('Details for other-user@example.com')
    cy.get('table').find('tr').first().find('td').first().contains('other-user@example.com')
    cy.get('table').find('tr').eq(1).find('td').first().contains('Administrator')
    cy.get('table').find('tr').eq(1).find('td').eq(1).find('a').contains('Edit permissions')
  })

  it('should redirect to edit user permissions page', () => {
    cy.get('a').contains('Edit permissions').click()
    cy.get('#role-admin-input').should('exist').should('have.attr', 'checked')
  })

  it('should update permission', () => {
    cy.get('#role-view-and-refund-input').click()
    cy.get('button').contains('Save changes').click()
    cy.get('.flash-container--good').contains('Permissions have been updated')
  })
})
