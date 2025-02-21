function checkTitleAndHeading (title, serviceName) {
  cy.title().should('eq', `${title} - Settings - ${serviceName} - GOV.UK Pay`)
  cy.get('h1').should('have.text', title)
}

module.exports = checkTitleAndHeading
