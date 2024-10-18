const checkDisplayedSettings = (length, expectedSettings) => {
  cy.get('.govuk-summary-list__row').should('have.length', length).each((row, index) => {
    const expected = expectedSettings[index]
    cy.wrap(row).find('.govuk-summary-list__key')
      .should('contain.text', expected.key)
    cy.wrap(row).find('.govuk-summary-list__value')
      .should('contain.text', expected.value)
    if (expected.actions.length > 0) {
      cy.wrap(row).find('.govuk-summary-list__actions')
        .should('have.length', expected.actions.length)
        .each((action, actionIndex) => {
          const expectedAction = expected.actions[actionIndex]
          cy.wrap(action).find('a')
            .should('contain.text', expectedAction.text)
            .and('have.attr', 'href', expectedAction.href)
        })
    }
  })
}

const checkServiceNameValidation = (options) => {
  const {
    settingsUrl,
    expectedInputValue,
    expectedErrorMessage
  } = options
  cy.visit(settingsUrl)
  cy.get('input[name="service-name-input"]').clear({ force: true })
  if (expectedInputValue) {
    cy.get('input[name="service-name-input"]').type(expectedInputValue)
  }
  cy.get('input[name="service-name-input"]').should('have.value', expectedInputValue)
  cy.get('.govuk-error-summary').should('not.exist')
  cy.get('button[form="edit-service-name-form"]').click()
  cy.get('.govuk-error-summary').should('exist').should('contain', expectedErrorMessage)
  cy.get('input[name="service-name-input"]').should('have.class', 'govuk-input--error')
  cy.get('#service-name-input-error').should('contain.text', expectedErrorMessage)
  cy.get('input[name="service-name-input"]').should('have.value', expectedInputValue)
}

const checkServiceNameEditActionNavigation = (options) => {
  const {
    selector,
    expectedUrl,
    expectedPageTitle,
    expectedHeader
  } = options
  cy.get(selector).click()
  cy.url().should('contain', expectedUrl)
  cy.title().should('eq', expectedPageTitle)
  cy.get('h1').should('contain.text', expectedHeader)
  cy.get('.govuk-back-link').click()
  cy.url().should('not.contain', expectedUrl)
  cy.title().should('eq', 'Settings - Service name - GOV.UK Pay')
}

module.exports = {
  checkDisplayedSettings,
  checkServiceNameValidation,
  checkServiceNameEditActionNavigation
}
