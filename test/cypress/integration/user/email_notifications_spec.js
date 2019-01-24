describe('Settings', () => {
  const settingsUrl = `/api-keys`
  const userExternalId = '7d19aff33f8948deb97ed16b2912dcd3'
  const gatewayAccountId = 666
  const serviceName = 'Test Service'

  beforeEach(() => {
    cy.task('getCookies', {
      user_external_id: userExternalId,
      gateway_account_id: gatewayAccountId
    }).then(cookies => {
      cy.setCookie('session', cookies.encryptedSessionCookie)
      cy.setCookie('gateway_account', cookies.encryptedGatewayAccountCookie)
    })

    cy.task('setupStubs', [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [{
            service: {
              name: serviceName,
              gateway_account_ids: [gatewayAccountId]
            }
          }]
        }
      },
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      },
      {
        name: 'getAccountAuthSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      },
      {
        name: 'patchConfirmationEmailToggleSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          enabled: true
        }
      },
      {
        name: 'patchRefundEmailToggleSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          enabled: true
        }
      },
      {
        name: 'patchAccountEmailCollectionModeSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          collectionMode: 'MANDATORY'
        }
      }
    ])

    cy.visit(settingsUrl)
  })

  describe('Settings default page', () => {
    it(`should have the page title 'API Keys - ${serviceName} test - GOV.UK Pay'`, () => {
      cy.title().should('eq', `API Keys - ${serviceName} test - GOV.UK Pay`)
    })
  })

  describe('Email notifications home page', () => {
    it(`should have the page title 'Email notifications - ${serviceName} test - GOV.UK Pay'`, () => {
      const emailNotificationsUrl = `/email-notifications`

      // Default notifications page and confirmation email tab contents
      cy.visit(emailNotificationsUrl)
      cy.title().should('eq', `Email notifications - ${serviceName} test - GOV.UK Pay`)
      cy.get('#confirmation-email-template').should('contain', 'Confirmation email template')

      // Click the 'Refund email' tab
      cy.get('#refund-tab').click()
      cy.url().should('include', '/email-notifications-refund')
      cy.get('#refund-email-template').should('contain', 'Refund email template')
    })
  })

  describe('Email collection mode page', () => {
    it(`should have the page title 'Email notifications - ${serviceName} test - GOV.UK Pay'`, () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the collection mode page
      cy.get('#email-notifications-toggle-collection').click()
      cy.title().should('eq', `Email notifications - ${serviceName} test - GOV.UK Pay`)
      cy.url().should('include', '/email-settings-collection')

      cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')

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
    it(`should have the page title 'Email notifications - ${serviceName} test - GOV.UK Pay'`, () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the confirmation toggle page
      cy.get('#email-notifications-toggle-confirmation').click()
      cy.title().should('eq', `Email notifications - ${serviceName} test - GOV.UK Pay`)

      cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send payment confirmation emails?')

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
    it(`should have the page title 'Email notifications - ${serviceName} test - GOV.UK Pay'`, () => {
      const emailNotificationsUrl = `/email-notifications`
      cy.visit(emailNotificationsUrl)

      // Access the refund toggle page
      cy.get('#email-notifications-toggle-refund').click()
      cy.title().should('eq', `Email notifications - ${serviceName} test - GOV.UK Pay`)

      cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send refund emails?')

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
