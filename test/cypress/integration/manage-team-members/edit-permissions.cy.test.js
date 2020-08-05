'use strict'

const { getUserWithServiceRoleStubOpts } = require('../../utils/user-stubs')

const SERVICE_EXTERNAL_ID = 'service_abc_123'
const AUTHENTICATED_USER_ID = 'authenticated-user-id'
const EDITING_USER_ID = 'user-we-are-editing-id'

describe('Edit service user permissions', () => {
  beforeEach(() => {
    // keep the same session for entire describe block
    Cypress.Cookies.preserveOnce('session')
    Cypress.Cookies.preserveOnce('gateway_account')

    const authenticatedUserStubOpts = getUserWithServiceRoleStubOpts(AUTHENTICATED_USER_ID, 'logged-in-user@example.com', SERVICE_EXTERNAL_ID, 'admin')
    const userWeAreEditingStubOpts = getUserWithServiceRoleStubOpts(EDITING_USER_ID, 'other-user@example.com', SERVICE_EXTERNAL_ID, 'admin')

    cy.task('setupStubs', [
      {
        name: 'getUserSuccess',
        opts: authenticatedUserStubOpts
      },
      {
        name: 'getUserSuccess',
        opts: userWeAreEditingStubOpts
      },
      {
        name: 'getServiceUsersSuccess',
        opts: {
          serviceExternalId: SERVICE_EXTERNAL_ID,
          users: [
            authenticatedUserStubOpts,
            userWeAreEditingStubOpts
          ]
        }
      },
      {
        name: 'getInvitedUsersSuccess',
        opts: {
          serviceExternalId: SERVICE_EXTERNAL_ID,
          invites: []
        }
      },
      {
        name: 'putUpdateServiceRoleSuccess',
        opts: {
          role: 'view-and-refund',
          external_id: EDITING_USER_ID,
          serviceExternalId: SERVICE_EXTERNAL_ID
        }
      }
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
