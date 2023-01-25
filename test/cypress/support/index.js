// ***********************************************************
// This file is processed and loaded automatically before
// Cypress test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

Cypress.Commands.add('setEncryptedCookies', (userId, pageData = {}) => {
  cy.task('getCookies', {
    user_external_id: userId,
    pageData
  }).then(cookies => {
    cy.setCookie('session', cookies.encryptedSessionCookie)
  })
})

beforeEach(() => {
  cy.task('clearStubs')
})
