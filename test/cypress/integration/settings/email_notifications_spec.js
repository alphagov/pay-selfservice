describe('Settings', () => {
  const settingsUrl = `/settings`
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Test Service'

  describe('For an admin user', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)

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
      it(`should have the page title 'Settings - ${serviceName} - GOV.UK Pay'`, () => {
        cy.title().should('eq', `Settings - ${serviceName} - GOV.UK Pay`)
      })
    })

    describe('Email notifications home page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        const emailNotificationsUrl = `/email-notifications`

        // Default notifications page and confirmation email tab contents
        cy.visit(emailNotificationsUrl)
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)
        cy.get('#confirmation-email-template').should('contain', 'Confirmation email template')

        // Click the 'Refund email' tab
        cy.get('#refund-tab').click()
        cy.url().should('include', '/email-notifications-refund')
        cy.get('#refund-email-template').should('contain', 'Refund email template')
      })
    })

    describe('Email collection mode page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        const emailNotificationsUrl = `/settings`
        cy.visit(emailNotificationsUrl)

        // Access the collection mode page
        cy.get('.email-notifications-toggle-collection').should('contain', 'Change')
        cy.get('.email-notifications-toggle-collection').click()
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)
        cy.url().should('include', '/email-settings-collection')

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')

        // Test the save button
        cy.contains('Save changes').click()
        cy.url().should('include', settingsUrl)

        // Access the collection mode page again
        cy.get('.email-notifications-toggle-collection').click()
        // Test the cancel button
        cy.contains('Cancel').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Confirmation email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        const emailNotificationsUrl = `/settings`
        cy.visit(emailNotificationsUrl)

        // Access the confirmation toggle page
        cy.get('.email-notifications-toggle-confirmation').should('contain', 'Change')
        cy.get('.email-notifications-toggle-confirmation').click()
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send payment confirmation emails?')

        cy.contains('Save changes').click()
        cy.url().should('include', settingsUrl)

        // Access the confirmation toggle page again
        cy.get('.email-notifications-toggle-confirmation').click()
        // Test the cancel button
        cy.contains('Cancel').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Refund email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        const emailNotificationsUrl = `/settings`
        cy.visit(emailNotificationsUrl)

        // Access the refund toggle page
        cy.get('.email-notifications-toggle-refund').should('contain', 'Change')
        cy.get('.email-notifications-toggle-refund').click()
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send refund emails?')

        cy.contains('Save changes').click()
        cy.url().should('include', settingsUrl)

        // Access the refund toggle page again
        cy.get('.email-notifications-toggle-refund').click()
        // Test the cancel button
        cy.contains('Cancel').click()
        cy.url().should('include', settingsUrl)
      })
    })
  })

  describe('For a read-only user', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)

      cy.task('setupStubs', [
        {
          name: 'getUserSuccess',
          opts: {
            external_id: userExternalId,
            service_roles: [{
              service: {
                name: serviceName,
                gateway_account_ids: [gatewayAccountId]
              },
              role: {
                permissions: [
                  {
                    name: 'email-notification-template:read',
                    description: 'Viewemailnotificationstemplate'
                  },
                  {
                    name: 'transactions-details:read',
                    description: 'Viewtransactionsdetailsonly'
                  }
                ]
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

    describe('Email notifications home page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        const emailNotificationsUrl = `/email-notifications`

        // Default notifications page and confirmation email tab contents
        cy.visit(emailNotificationsUrl)
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)
        cy.get('#confirmation-email-template').should('contain', 'Confirmation email template')

        // Click the 'Refund email' tab
        cy.get('#refund-tab').click()
        cy.url().should('include', '/email-notifications-refund')
        cy.get('#refund-email-template').should('contain', 'Refund email template')
      })
    })

    describe('Email collection mode page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        const emailNotificationsUrl = `/settings`
        cy.visit(emailNotificationsUrl)

        // Access the collection mode page
        cy.get('.email-notifications-toggle-collection').should('contain', 'View')
        cy.get('.email-notifications-toggle-collection').click()
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)
        cy.url().should('include', '/email-settings-collection')

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to ask users for an email address on the card payment page?')

        // Test it’s read-only
        cy.get('input[disabled]').should('have.length', 3)
        // Test the back button
        cy.contains('Go back').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Confirmation email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        cy.visit(settingsUrl)

        // Access the confirmation toggle page
        cy.get('.email-notifications-toggle-confirmation').should('contain', 'View')
        cy.get('.email-notifications-toggle-confirmation').click()
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send payment confirmation emails?')

        // Test it’s read-only
        cy.get('input[disabled]').should('have.length', 2)
        // Test the back button
        cy.contains('Go back').click()
        cy.url().should('include', settingsUrl)
      })
    })

    describe('Refund email toggle page', () => {
      it(`should have the page title 'Email notifications - ${serviceName} sandbox test - GOV.UK Pay'`, () => {
        cy.visit(settingsUrl)

        // Access the refund toggle page
        cy.get('.email-notifications-toggle-refund').should('contain', 'View')
        cy.get('.email-notifications-toggle-refund').click()
        cy.title().should('eq', `Email notifications - ${serviceName} sandbox test - GOV.UK Pay`)

        cy.get('.govuk-fieldset__heading').first().should('contain', 'Do you want to send refund emails?')

        // Test it’s read-only
        cy.get('input[disabled]').should('have.length', 2)
        // Test the cancel button
        cy.contains('Go back').click()
        cy.url().should('include', settingsUrl)
      })
    })
  })
})
