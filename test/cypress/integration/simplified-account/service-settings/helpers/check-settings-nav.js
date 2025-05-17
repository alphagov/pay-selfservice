function checkSettingsNavigation(settingName, settingUrl) {
  cy.get('.service-nav')
    .find('a')
    .contains(settingName)
    .should('have.attr', 'href', settingUrl)
    .should('have.attr', 'aria-current', 'page')
    .should('have.attr', 'current', '')
}

module.exports = checkSettingsNavigation
