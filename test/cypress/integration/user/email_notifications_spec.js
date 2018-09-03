describe('Settings', () => {
  const settingsUrl = `/api-keys`

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
    cy.visit(settingsUrl)
  })

  describe('Settings default page', () => {
    it('should have the page title \'API Keys - System Generated test - GOV.UK Pay\'', () => {
      cy.title().should('eq', 'API Keys - System Generated test - GOV.UK Pay')
    })
  })

  describe('Email notifications home page', () => {
    it('should have the page title \'Email notifications - System Generated test - GOV.UK Pay\'', () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')
    })
  })

  describe('Email collection mode page', () => {
    it('should have the page title \'Email notifications - System Generated test - GOV.UK Pay\'', () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the collection mode page
      cy.get('#email-notifications-toggle-collection').click()
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')
      cy.url().should('include', '/email-settings-collection')

      cy.get('.heading-medium').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')

      cy.contains('Save changes').click()
      cy.url().should('include', '/email-notifications')
    })
  })

  describe('Confirmation email toggle page', () => {
    it('should have the page title \'Email notifications - System Generated test - GOV.UK Pay\'', () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the collection mode page
      cy.get('#email-notifications-toggle-confirmation').click()
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')

      cy.get('.heading-medium').first().should('contain', 'Do you want GOV.UK Pay to send users payment confirmation emails?')

      cy.contains('Save changes').click()
      cy.url().should('include', '/email-notifications')
    })
  })

  describe('Refund email toggle page', () => {
    it('should have the page title \'Email notifications - System Generated test - GOV.UK Pay\'', () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the collection mode page
      cy.get('#email-notifications-toggle-refund').click()
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')

      cy.get('.heading-medium').first().should('contain', 'Do you want GOV.UK Pay to send users refund receipt emails?')

      cy.contains('Save changes').click()
      cy.url().should('include', '/email-notifications')
    })
  })
})
