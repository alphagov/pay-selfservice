'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Your PSP settings page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Purchase a positron projection permit'
  const testCredentials = {
    merchant_id: 'positron-permit-people',
    username: 'jonheslop',
    password: 'anti-matter'
  }
  const testNotificationCredentials = {
    version: 1,
    userName: 'someone',
    password: 'email-me'
  }
  const testFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c80',
    issuer: '5bd9e0e4444dce153428c940',
    jwt_mac_key: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
  }

  function setupYourPspStubs (opts = {}) {
    let stubs = []
    let user
    const role = {
      permissions: [
        {
          name: 'transactions-details:read',
          description: 'ViewTransactionsOnly'
        },
        {
          name: 'toggle-3ds:read',
          description: 'View3dsOnly'
        }
      ]
    }

    if (opts.readonly) {
      user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, role })
    } else {
      user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })
    }

    const gatewayAccount = gatewayAccountStubs.getGatewayAccountSuccess({
      gatewayAccountId,
      requires3ds: opts.requires3ds,
      integrationVersion3ds: opts.integrationVersion3ds,
      worldpay3dsFlex: opts.worldpay3dsFlex,
      credentials: opts.credentials,
      paymentProvider: opts.gateway,
      notificationCredentials: opts.notificationCredentials
    })
    const card = gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId, updated: false })
    const patchUpdateCredentials = gatewayAccountStubs.patchUpdateCredentials({ gatewayAccountId, testCredentials })
    const patchIntegrationVersion3ds = gatewayAccountStubs.patchIntegrationVersion3ds({ integrationVersion3ds: opts.integrationVersion3ds })
    stubs.push(user, gatewayAccount, card, patchUpdateCredentials, patchIntegrationVersion3ds)

    cy.task('setupStubs', stubs)
  }

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('When using a sandbox account', () => {
    beforeEach(() => {
      setupYourPspStubs()
    })

    it('should not show link to Your PSP in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/settings')
      cy.get('#navigation-menu-your-psp').should('have.length', 0)
    })
  })

  describe('When using a Worldpay account', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'worldpay'
      })
    })

    it('should show link to "Your PSP - Worldpay" in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/settings')
      cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Worldpay')
      cy.get('#navigation-menu-your-psp').click()
    })

    it('should show all credentials as unconfigured', () => {
      cy.get('.value-merchant-id').should('contain', 'Not configured')
      cy.get('.value-username').should('contain', 'Not configured')
      cy.get('.value-password').should('contain', 'Not configured')
      cy.get('.value-organisational-unit-id').should('contain', 'Not configured')
      cy.get('.value-issuer').should('contain', 'Not configured')
      cy.get('.value-jwt-mac-key').should('contain', 'Not configured')
    })

    it('should allow account credentials to be configured and all values must be set', () => {
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').type(testCredentials.merchant_id)
      cy.get('#username').type(testCredentials.username)
      cy.get('#submitCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('#password').type(testCredentials.password)
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })

    it('should allow 3DS Flex credentials to be configured (trimming leading and trailing space) and all values must be valid and set', () => {
      cy.get('#flex-credentials-change-link').click()
      cy.get('#removeFlexCredentials').should('not.exist')
      cy.get('#organisational-unit-id').type('Invalid organisational unit ID')
      cy.get('#issuer').type('Invalid issuer')
      cy.get('#jwt-mac-key').type('Invalid JWT MAC key')
      cy.get('#submitFlexCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('#organisational-unit-id').should('have.value', 'Invalid organisational unit ID')
      cy.get('#issuer').should('have.value', 'Invalid issuer')
      cy.get('#jwt-mac-key').should('have.value', '')
      cy.get('#organisational-unit-id').clear().type(' ' + testFlexCredentials.organisational_unit_id + ' ')
      cy.get('#issuer').clear().type(' ' + testFlexCredentials.issuer + ' ')
      cy.get('#jwt-mac-key').type(' ' + testFlexCredentials.jwt_mac_key + ' ')
      cy.get('#submitFlexCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })
  })

  describe('When using a Worldpay account with existing credentials', () => {
    it('should show all credentials as configured', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        credentials: testCredentials,
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('.value-merchant-id').should('contain', testCredentials.merchant_id)
      cy.get('.value-username').should('contain', testCredentials.username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
      cy.get('.value-organisational-unit-id').should('contain', testFlexCredentials.organisational_unit_id)
      cy.get('.value-issuer').should('contain', testFlexCredentials.issuer)
      cy.get('.value-jwt-mac-key').should('contain', '●●●●●●●●')

      cy.get('#flex-credentials-change-link').click()
    })
  })

  describe('When using a Worldpay account to toggle 3DS Flex', () => {
    it('should have a button to enable 3DS Flex if 3DS is enabled, 3DS integration version is 1 and there are 3DS Flex creds', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: true,
        integrationVersion3ds: 1,
        credentials: testCredentials,
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('#worldpay-3ds-flex-is-off').should('exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
      cy.get('#disable-worldpay-3ds-flex-button').should('not.exist')

      cy.get('#enable-worldpay-3ds-flex-button').should('exist').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })

    it('should have a button to disable 3DS Flex if 3DS is enabled and 3DS integration version is 2', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: true,
        integrationVersion3ds: 2,
        credentials: testCredentials,
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('#worldpay-3ds-flex-is-on').should('exist')
      cy.get('#worldpay-3ds-flex-is-off').should('not.exist')
      cy.get('#enable-worldpay-3ds-flex-button').should('not.exist')

      cy.get('#disable-worldpay-3ds-flex-button').should('exist').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })

    it('should have not have a button to enable 3DS Flex if 3DS is enabled, 3DS integration version is 1 but there are no 3DS Flex credentials', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: false,
        integrationVersion3ds: 1,
        credentials: testCredentials
      })

      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('#worldpay-3ds-flex-is-off').should('exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
      cy.get('#disable-worldpay-3ds-flex-button').should('not.exist')
      cy.get('#enable-worldpay-3ds-flex-button').should('not.exist')
    })

    it('should have not have a button to enable or disable 3DS Flex if 3DS is disabled', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: false,
        integrationVersion3ds: 1,
        credentials: testCredentials,
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('#worldpay-3ds-flex-is-off').should('exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
      cy.get('#disable-worldpay-3ds-flex-button').should('not.exist')
      cy.get('#enable-worldpay-3ds-flex-button').should('not.exist')
    })
  })

  describe('When using a Smartpay account', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'smartpay'
      })
    })

    it('should show link to "Your PSP - Smartpay" in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/settings')
      cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Smartpay')
      cy.get('#navigation-menu-your-psp').click()
    })

    it('should show all credentials as unconfigured', () => {
      cy.get('.value-merchant-id').should('contain', 'Not configured')
      cy.get('.value-username').should('contain', 'Not configured')
      cy.get('.value-password').should('contain', 'Not configured')
    })

    it('should allow all credentials to be configured and all values must be set', () => {
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').type(testCredentials.merchant_id)
      cy.get('#username').type(testCredentials.username)
      cy.get('#submitCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('#password').type(testCredentials.password)
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })

    it('should allow all notification credentials to be configured and all values must be set', () => {
      cy.get('#notification-credentials-change-link').click()
      cy.get('#notification-username').type(testCredentials.username)
      cy.get('#submitNotificationCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('#notification-password').type(testCredentials.password)
      cy.get('#submitNotificationCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })
  })

  describe('When using a Smartpay account with existing credentials', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'smartpay',
        credentials: testCredentials,
        notificationCredentials: testNotificationCredentials
      })
    })

    it('should show all credentials as configured', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('.value-merchant-id').should('contain', testCredentials.merchant_id)
      cy.get('.value-username').should('contain', testCredentials.username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
      cy.get('.value-notification-username').should('contain', testNotificationCredentials.userName)
      cy.get('.value-notification-password').should('contain', '●●●●●●●●')
    })
  })

  describe('When using an ePDQ account', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'epdq'
      })
    })

    it('should show link to "Your PSP - ePDQ" in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/settings')
      cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - ePDQ')
      cy.get('#navigation-menu-your-psp').click()
    })

    it('should show all credentials as unconfigured', () => {
      cy.get('.value-merchant-id').should('contain', 'Not configured')
      cy.get('.value-username').should('contain', 'Not configured')
      cy.get('.value-password').should('contain', 'Not configured')
      cy.get('.value-sha-in').should('contain', 'Not configured')
      cy.get('.value-sha-out').should('contain', 'Not configured')
    })

    it('should allow all credentials to be configured and all values must be set', () => {
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').type(testCredentials.merchant_id)
      cy.get('#username').type(testCredentials.username)
      cy.get('#password').type(testCredentials.password)
      cy.get('#shaInPassphrase').type(testCredentials.password)
      cy.get('#submitCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('#shaOutPassphrase').type(testCredentials.password)
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/your-psp`)
      })
    })
  })

  describe('When using an ePDQ account with existing credentials', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'epdq',
        credentials: testCredentials
      })
    })

    it('should show all credentials as configured', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/your-psp')
      cy.get('.value-merchant-id').should('contain', testCredentials.merchant_id)
      cy.get('.value-username').should('contain', testCredentials.username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
    })
  })
})
