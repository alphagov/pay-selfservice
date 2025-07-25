const checkServiceNavigation = (name: string, url: string) => {
  cy.get('.service-nav')
    .find('a')
    .contains(name)
    .should('have.attr', 'href', url)
    .should('have.attr', 'aria-current', 'page')
    .should('have.attr', 'data-current', '')
}

const checkTitleAndHeading = (title: string, serviceName: string) => {
  cy.title().should('eq', `${title} - ${serviceName} - GOV.UK Pay`)
  cy.get('h1').should('contain.text', title)
}

export {
  checkServiceNavigation,
  checkTitleAndHeading
}
