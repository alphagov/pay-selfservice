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

Cypress.Commands.add('setEncryptedCookies', (userId, pageData = {}) => {
  cy.task('getCookies', {
    user_external_id: userId,
    pageData
  }).then(cookies => {
    cy.setCookie('session', cookies.encryptedSessionCookie)
  })
})

Cypress.Commands.add('a11yCheck', (excludeSelectors = { exclude: ['.govuk-skip-link'] }) => {
  return cy.checkAccessibility(
    excludeSelectors,
    {
      generateReport: false,
      includedImpacts: ['critical', 'serious', 'moderate', 'minor'],
      runOnly: ['wcag22aa', 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
    }
  )
})

Cypress.Commands.add('createPaymentLinkWithTitle', (title, createUrl) => {
  cy.visit(createUrl);
  cy.get('#service-content').find('form').find('#name')
    .click().focused()
    .type(title)
  cy.get('#service-content').find('form').find('button').click()
});

Cypress.Commands.add('createPaymentLinkWithReference', (title, createUrl) => {
  cy.createPaymentLinkWithTitle(title, createUrl);
  cy.get('#reference-type-standard').click()
  cy.get('#service-content').find('form').find('button').click()
});

Cypress.Commands.add('createPaymentLinkWithAmount', (title, createUrl) => {
  cy.createPaymentLinkWithReference(title, createUrl);
  cy.get('#amount-type-variable').click()
  cy.get('#service-content').find('form').find('button').click()
});

Cypress.Commands.add('createPaymentLinkWithMetadata', (title, createUrl, columnHeader, cellConetent) => {
  cy.createPaymentLinkWithAmount(title, createUrl);
  cy.get('.govuk-button--secondary').click()
  cy.get('#service-content').find('form').find('#reporting-column').click().focused().clear().type(columnHeader)
  cy.get('#service-content').find('form').find('#cell-content').click().focused().type(cellConetent)
  cy.get('#service-content').find('form').find('button').contains('Add reporting column').click()
});

beforeEach(() => {
  cy.task('clearStubs')
})
