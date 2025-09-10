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