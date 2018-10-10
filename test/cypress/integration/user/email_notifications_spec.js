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

      // Default notifications page and confirmation email tab contents
      cy.visit(emailNotificationsUrl)
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')
      cy.get('#email-templates').get('.heading-medium').should('contain', 'Confirmation email template')

      // Click the 'Refund email' tab
      cy.get('.tabs').contains('Refund email').click()
      cy.url().should('include', '/email-notifications-refund')
      cy.get('#email-templates').get('.heading-medium').should('contain', 'Refund email template')
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

      // Test the save button
      cy.contains('Save changes').click()
      cy.url().should('include', '/email-notifications')

      // Access the collection mode page again
      cy.get('#email-notifications-toggle-collection').click()
      // Test the cancel button
      cy.contains('Cancel').click()
      cy.url().should('include', '/email-notifications')
    })
  })

  describe('Confirmation email toggle page', () => {
    it('should have the page title \'Email notifications - System Generated test - GOV.UK Pay\'', () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the confirmation toggle page
      cy.get('#email-notifications-toggle-confirmation').click()
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')

      cy.get('.heading-medium').first().should('contain', 'Do you want to send payment confirmation emails?')

      cy.contains('Save changes').click()
      cy.url().should('include', '/email-notifications')

      // Access the confirmation toggle page again
      cy.get('#email-notifications-toggle-confirmation').click()
      // Test the cancel button
      cy.contains('Cancel').click()
      cy.url().should('include', '/email-notifications')
    })
  })

  describe('Refund email toggle page', () => {
    it('should have the page title \'Email notifications - System Generated test - GOV.UK Pay\'', () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the refund toggle page
      cy.get('#email-notifications-toggle-refund').click()
      cy.title().should('eq', 'Email notifications - System Generated test - GOV.UK Pay')

      cy.get('.heading-medium').first().should('contain', 'Do you want to send refund emails?')

      cy.contains('Save changes').click()
      cy.url().should('include', '/email-notifications')

      // Access the refund toggle page again
      cy.get('#email-notifications-toggle-refund').click()
      // Test the cancel button
      cy.contains('Cancel').click()
      cy.url().should('include', '/email-notifications')
    })
  })
})
