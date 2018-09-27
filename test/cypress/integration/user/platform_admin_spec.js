describe('Dashboard', () => {
  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')
  const selfServicePlatformAdminUser = selfServiceUsers.config.users.filter(fil => !fil.is_primary && fil.is_platform_admin)[0]

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookiePlatformAdmin'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookiePlatformAdmin'))
  })

  describe('Homepage request', () => {
    it('should forward the user to `My services`', () => {
      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
      // Ensure the platform admin navigation link is available
      cy.get('li a.govuk-header__link').should(($li) => {
        expect($li).to.have.length(5)
        expect($li.eq(3)).to.contain('Platform admin')
      })
      const services = selfServicePlatformAdminUser.service_roles.length === 1 ? 'service' : 'services'
      cy.get('#main-content .govuk-heading-l').contains(`You have ${selfServicePlatformAdminUser.service_roles.length} ${services}`)
    })
  })

  describe('Platform admin page', () => {
    it('should be accessible from the header navigation', () => {
      cy.visit('/my-services')
      // Access the platform admin page
      cy.get('a.govuk-header__link[href="/platform-admin"]').click()
      cy.title().should('eq', 'Platform admin - GOV.UK Pay')
    })
  })
})
