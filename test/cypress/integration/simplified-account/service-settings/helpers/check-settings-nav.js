function checkSettingsNavigation (settingName, settingUrl) {
  it(`should show active ${settingName} link`, () => {
    cy.get('.service-settings-nav')
      .find('li')
      .contains(settingName)
      .then(li => {
        cy.wrap(li)
          .should('have.attr', 'href', settingUrl)
          .parent().should('have.class', 'service-settings-nav__li--active')
      })
  })
}

module.exports = checkSettingsNavigation
