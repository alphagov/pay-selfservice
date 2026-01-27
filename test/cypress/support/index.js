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
import 'wick-a11y'
import '@percy/cypress'

Cypress.Commands.add('setEncryptedCookies', (userId, pageData = {}) => {
  cy.task('getCookies', {
    user_external_id: userId,
    pageData,
  }).then((cookies) => {
    cy.setCookie('session', cookies.encryptedSessionCookie)
  })
})

Cypress.Commands.add('a11yCheck', (excludeSelectors = { exclude: ['.govuk-skip-link'] }) => {
  return cy.checkAccessibility(excludeSelectors, {
    generateReport: false,
    includedImpacts: ['critical', 'serious', 'moderate', 'minor'],
    runOnly: ['wcag22aa', 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  })
})

beforeEach(() => {
  cy.task('clearStubs')
})
