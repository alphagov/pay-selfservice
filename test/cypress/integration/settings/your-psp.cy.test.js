'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Your PSP settings page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const gatewayAccountExternalId = 'a-valid-external-id'
  const credentialExternalId = 'a-credential-external-id'
  const serviceName = 'Purchase a positron projection permit'
  const yourPspPath = `/account/${gatewayAccountExternalId}/your-psp`

  const testCredentials = {
    merchant_id: 'positron-permit-people',
    username: 'jonheslop',
    password: 'anti-matter'
  }
  const testCredentialsMOTO = {
    merchant_id: 'merchant-code-ending-with-MOTO',
    username: 'user-name',
    password: 'anti-matter'
  }
  const testNotificationCredentials = {
    version: 1,
    username: 'someone',
    password: 'email-me'
  }
  const testFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c80',
    issuer: '5bd9e0e4444dce153428c940',
    jwt_mac_key: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
  }
  const testInvalidFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c81',
    issuer: '5bd9e0e4444dce153428c941', // pragma: allowlist secret
    jwt_mac_key: 'ffffffff-aaaa-1111-1111-52805d5cd9e1'
  }
  const testFailureFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c82',
    issuer: '5bd9e0e4444dce153428c942', // pragma: allowlist secret
    jwt_mac_key: 'ffffffff-ffff-ffff-ffff-ffffffffffff'
  }
  const testBadResultFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c83',
    issuer: '5bd9e0e4444dce153428c943', // pragma: allowlist secret
    jwt_mac_key: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e3'
  }

  function setupYourPspStubs (opts = {}) {
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
      allowMoto: opts.allowMoto,
      integrationVersion3ds: opts.integrationVersion3ds,
      worldpay3dsFlex: opts.worldpay3dsFlex,
      credentials: opts.credentials,
      paymentProvider: opts.gateway,
      notificationCredentials: opts.notificationCredentials,
      requiresAdditionalKycData: opts.requiresAdditionalKycData,
      ...opts.gatewayAccountCredentials && { gatewayAccountCredentials: opts.gatewayAccountCredentials }
    })
    const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      requires3ds: opts.requires3ds,
      allowMoto: opts.allowMoto,
      integrationVersion3ds: opts.integrationVersion3ds,
      worldpay3dsFlex: opts.worldpay3dsFlex,
      credentials: opts.credentials,
      paymentProvider: opts.gateway,
      notificationCredentials: opts.notificationCredentials,
      requiresAdditionalKycData: opts.requiresAdditionalKycData,
      ...opts.gatewayAccountCredentials && { gatewayAccountCredentials: opts.gatewayAccountCredentials }
    })
    const card = gatewayAccountStubs.getAcceptedCardTypesSuccess({ gatewayAccountId, updated: false })
    const postCheckWorldpay3dsFlexCredentialsReturnsValid = gatewayAccountStubs.postCheckWorldpay3dsFlexCredentials({
      gatewayAccountId: gatewayAccountId,
      shouldReturnValid: true
    })
    const postCheckWorldpayCredentials = gatewayAccountStubs.postCheckWorldpayCredentials({
      ...opts.validateCredentials,
      gatewayAccountId
    })
    const postCheckWorldpay3dsFlexCredentialsReturnsInvalid = gatewayAccountStubs.postCheckWorldpay3dsFlexCredentials({
      gatewayAccountId: gatewayAccountId,
      shouldReturnValid: false
    })
    const postCheckWorldpay3dsFlexCredentialsFails = gatewayAccountStubs.postCheckWorldpay3dsFlexCredentialsFailure({
      gatewayAccountId: gatewayAccountId, ...testFailureFlexCredentials
    })
    const postCheckWorldpay3dsFlexCredentialsReturnsBadResult = gatewayAccountStubs.postCheckWorldpay3dsFlexCredentialsWithBadResult({
      gatewayAccountId: gatewayAccountId, ...testBadResultFlexCredentials
    })
    const stubs = [
      user,
      gatewayAccount,
      gatewayAccountByExternalId,
      card,
      postCheckWorldpay3dsFlexCredentialsReturnsValid,
      postCheckWorldpay3dsFlexCredentialsReturnsInvalid,
      postCheckWorldpay3dsFlexCredentialsFails,
      postCheckWorldpay3dsFlexCredentialsReturnsBadResult,
      postCheckWorldpayCredentials
    ]

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
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('#navigation-menu-your-psp').should('have.length', 0)
    })
  })

  describe('When using a Worldpay account', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'worldpay',
        emptyCredentials: true,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          external_id: credentialExternalId,
          state: 'CREATED',
          credentials: {}
        }],
        validateCredentials: testCredentials
      })
    })

    it('should show link to "Your PSP - Worldpay" in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
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
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
    })

    it('should not allow MOTO merchant account code', () => {
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').type('merchant-account-code-ending-with-MOTO')
      cy.get('#username').type(testCredentials.username)
      cy.get('#password').type(testCredentials.password)
      cy.get('#submitCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'MOTO merchant code not allowed. Please contact support if you would like MOTO payments enabled')
    })

    it('should allow 3DS Flex credentials to be configured (trimming leading and trailing space) and all values must be valid and set', () => {
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
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
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
    })

    it('should not allow invalid 3DS Flex credentials to be saved', () => {
      cy.get('#flex-credentials-change-link').click()
      cy.get('#organisational-unit-id').type(testInvalidFlexCredentials.organisational_unit_id)
      cy.get('#issuer').type(testInvalidFlexCredentials.issuer)
      cy.get('#jwt-mac-key').type(testInvalidFlexCredentials.jwt_mac_key)
      cy.get('#submitFlexCredentials').click()
      cy.title().should('eq', 'Error: Your PSP - Purchase a positron projection permit Worldpay - GOV.UK Pay')
      cy.get('.govuk-error-summary').contains('There is a problem')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Organisational unit ID may not be correct')
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('have.attr', 'href', '#organisational-unit-id')
      cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('contain', 'Issuer may not be correct')
      cy.get('ul.govuk-error-summary__list > li:nth-child(2) > a').should('have.attr', 'href', '#issuer')
      cy.get('ul.govuk-error-summary__list > li:nth-child(3) > a').should('contain', 'JWT MAC key may not be correct')
      cy.get('ul.govuk-error-summary__list > li:nth-child(3) > a').should('have.attr', 'href', '#jwt-mac-key')
      cy.get('input#organisational-unit-id').should('have.class', 'govuk-input--error')
      cy.get('#organisational-unit-id-error').should('contain', 'Enter your organisational unit ID in the format you received it')
      cy.get('input#issuer').should('have.class', 'govuk-input--error')
      cy.get('#issuer-error').should('contain', 'Enter your issuer in the format you received it')
      cy.get('input#jwt-mac-key').should('have.class', 'govuk-input--error')
      cy.get('#jwt-mac-key-error').should('contain', 'Enter your JWT MAC key in the format you received it')
      cy.get('#organisational-unit-id').should('have.value', testInvalidFlexCredentials.organisational_unit_id)
      cy.get('#issuer').should('have.value', testInvalidFlexCredentials.issuer)
      cy.get('#jwt-mac-key').should('have.value', '')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}/flex`)
      })
    })

    it('should display generic problem page when checking 3DS Flex credentials fails', () => {
      cy.get('#organisational-unit-id').clear().type(testFailureFlexCredentials.organisational_unit_id)
      cy.get('#issuer').clear().type(testFailureFlexCredentials.issuer)
      cy.get('#jwt-mac-key').type(testFailureFlexCredentials.jwt_mac_key)
      cy.get('#submitFlexCredentials').click()
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'There is a problem with the payments platform. Please contact the support team.')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}/flex`)
      })
    })

    it('should display generic problem page when getting a bad result from connector', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('#navigation-menu-your-psp').click()
      cy.get('#flex-credentials-change-link').click()
      cy.get('#organisational-unit-id').type(testBadResultFlexCredentials.organisational_unit_id)
      cy.get('#issuer').type(testBadResultFlexCredentials.issuer)
      cy.get('#jwt-mac-key').type(testBadResultFlexCredentials.jwt_mac_key)
      cy.get('#submitFlexCredentials').click()
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'Please try again or contact support team.')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}/flex`)
      })
    })
  })

  describe('When using a Worldpay account with existing credentials', () => {
    it('should show all credentials as configured', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: testCredentials,
          external_id: credentialExternalId
        }],
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('.value-merchant-id').should('contain', testCredentials.merchant_id)
      cy.get('.value-username').should('contain', testCredentials.username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
      cy.get('.value-organisational-unit-id').should('contain', testFlexCredentials.organisational_unit_id)
      cy.get('.value-issuer').should('contain', testFlexCredentials.issuer)
      cy.get('.value-jwt-mac-key').should('contain', '●●●●●●●●')

      cy.get('#flex-credentials-change-link').click()
    })
  })

  describe('When using a Worldpay account with MOTO enabled', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: true,
        allowMoto: true,
        integrationVersion3ds: 1,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: {},
          external_id: credentialExternalId
        }],
        validateCredentials: testCredentialsMOTO
      })
    })
    it('should not have 3DS flex section', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('h2').contains('3DS Flex').should('not.exist')
      cy.get('#worldpay-3ds-flex-is-off').should('not.exist')
      cy.get('#worldpay-3ds-flex-is-off').should('not.exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
      cy.get('#disable-worldpay-3ds-flex-button').should('not.exist')
      cy.get('#enable-worldpay-3ds-flex-button').should('not.exist')
    })

    it('should not allow non-MOTO merchant account code', () => {
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').clear()
      cy.get('#merchantId').type('non-moto-merchant-code')
      cy.get('#username').type(testCredentialsMOTO.username)
      cy.get('#password').type(testCredentialsMOTO.password)
      cy.get('#submitCredentials').click()
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'Enter a MOTO merchant code. MOTO payments are enabled for the account')
    })

    it('should allow MOTO merchant account code', () => {
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').clear()
      cy.get('#merchantId').type(testCredentialsMOTO.merchant_id)
      cy.get('#username').type(testCredentialsMOTO.username)
      cy.get('#password').type(testCredentialsMOTO.password)
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
      cy.get('h1').contains('Your payment service provider (PSP) - Worldpay').should('exist')
    })
  })

  describe('When using a Worldpay account to toggle 3DS Flex', () => {
    it('should have a button to enable 3DS Flex if 3DS is enabled, 3DS integration version is 1 and there are 3DS Flex creds', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: true,
        integrationVersion3ds: 1,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: testCredentials,
          external_id: credentialExternalId
        }],
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#worldpay-3ds-flex-is-off').should('exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
      cy.get('#disable-worldpay-3ds-flex-button').should('not.exist')

      cy.get('#enable-worldpay-3ds-flex-button').should('exist').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
    })

    it('should have a button to disable 3DS Flex if 3DS is enabled and 3DS integration version is 2', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: true,
        integrationVersion3ds: 2,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: testCredentials,
          external_id: credentialExternalId
        }],
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#worldpay-3ds-flex-is-on').should('exist')
      cy.get('#worldpay-3ds-flex-is-off').should('not.exist')
      cy.get('#enable-worldpay-3ds-flex-button').should('not.exist')

      cy.get('#disable-worldpay-3ds-flex-button').should('exist').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
    })

    it('should have not have a button to enable 3DS Flex if 3DS is enabled, 3DS integration version is 1 but there are no 3DS Flex credentials', () => {
      setupYourPspStubs({
        gateway: 'worldpay',
        requires3ds: false,
        integrationVersion3ds: 1,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: testCredentials,
          external_id: credentialExternalId
        }]
      })

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
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
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: testCredentials,
          external_id: credentialExternalId
        }],
        worldpay3dsFlex: testFlexCredentials
      })

      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#worldpay-3ds-flex-is-off').should('exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
      cy.get('#disable-worldpay-3ds-flex-button').should('not.exist')
      cy.get('#enable-worldpay-3ds-flex-button').should('not.exist')
    })
  })

  describe('When using a Smartpay account', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'smartpay',
        gatewayAccountCredentials: [{
          payment_provider: 'smartpay',
          credentials: {},
          external_id: credentialExternalId
        }]
      })
    })

    it('should show link to "Your PSP - Smartpay" in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
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
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
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
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
    })
  })

  describe('When using a Smartpay account with existing credentials', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'smartpay',
        gatewayAccountCredentials: [{
          payment_provider: 'smartpay',
          credentials: testCredentials,
          external_id: credentialExternalId
        }],
        notificationCredentials: testNotificationCredentials
      })
    })

    it('should show all credentials as configured', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('.value-merchant-id').should('contain', testCredentials.merchant_id)
      cy.get('.value-username').should('contain', testCredentials.username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
      cy.get('.value-notification-username').should('contain', testNotificationCredentials.username)
      cy.get('.value-notification-password').should('contain', '●●●●●●●●')
    })
  })

  describe('When using an ePDQ account', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'epdq',
        gatewayAccountCredentials: [{
          payment_provider: 'epdq',
          credentials: {},
          external_id: credentialExternalId
        }]
      })
    })

    it('should show link to "Your PSP - ePDQ" in the side navigation', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
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
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
    })
  })

  describe('When using an ePDQ account with existing credentials', () => {
    beforeEach(() => {
      setupYourPspStubs({
        gateway: 'epdq',
        gatewayAccountCredentials: [{
          payment_provider: 'epdq',
          credentials: testCredentials,
          external_id: credentialExternalId
        }]
      })
    })

    it('should show all credentials as configured', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('.value-merchant-id').should('contain', testCredentials.merchant_id)
      cy.get('.value-username').should('contain', testCredentials.username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
    })
  })
})
