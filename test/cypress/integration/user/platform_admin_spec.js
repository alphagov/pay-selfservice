describe('Dashboard', () => {

  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')
  const selfServicePlatformAdminUser = selfServiceUsers.config.users.filter(fil => !fil.is_primary && fil.is_platform_admin)[0]

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookiePlatformAdmin'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookiePlatformAdmin'))
  })

  describe('Homepage', () => {
    it('should have the page title \'Dashboard - System Generated test - GOV.UK Pay\'', () => {

      cy.visit('/')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')

      // Ensure the platform admin navigation link is available
      cy.get('li a.govuk-header__link').should(($li) => {
        expect($li).to.have.length(5)
        expect($li.eq(3)).to.contain('Platform admin')
      })

      // Ensure they have been sent to the 'My services' page and the number of non platform admin services matches up
      cy.location().should(($loc) => {
        expect($loc.pathname).to.eq('/my-services')
      })

      cy.get('#main-content .govuk-heading-l').contains(`You have ${selfServicePlatformAdminUser.service_roles.length} services`)

    })
  })

  describe('Platform admin page', () => {
    it('should have the page title \'Dashboard - System Generated test - GOV.UK Pay\'', () => {

      cy.visit('/')

      // Access the platform admin page
      cy.get('Platform admin').click()

    })
  })

})
