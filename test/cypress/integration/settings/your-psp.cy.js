'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Your PSP settings page', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const gatewayAccountExternalId = 'a-valid-external-id'
  const credentialExternalId = 'a-credential-external-id'
  const credentialsId = 101
  const serviceName = 'Purchase a positron projection permit'
  const yourPspPath = `/account/${gatewayAccountExternalId}/your-psp`

  const testCredentials = {
    merchant_code: 'positron-permit-people',
    username: 'jonheslop',
    password: 'anti-matter'
  }

  const testCredentialsMOTO = {
    merchant_code: 'merchant-code-ending-with-MOTO',
    username: 'user-name',
    password: 'anti-matter'
  }

  const testCredentialsMOTOGBP = {
    merchant_code: 'merchant-code-ending-with-MOTOGBP',
    username: 'user-name',
    password: 'anti-matter'
  }

  const testFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c80',
    issuer: '5bd9e0e4444dce153428c940',
    jwt_mac_key: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e0'
  }

  const testInvalidFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c81',
    issuer: '5bd9e0e4444dce153428c941',
    jwt_mac_key: 'ffffffff-aaaa-1111-1111-52805d5cd9e1'
  }

  const testBadResultFlexCredentials = {
    organisational_unit_id: '5bd9b55e4444761ac0af1c83',
    issuer: '5bd9e0e4444dce153428c943',
    jwt_mac_key: 'fa2daee2-1fbb-45ff-4444-52805d5cd9e3'
  }

  function getUserAndGatewayAccountStubs (opts = {}) {
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
      recurringEnabled: opts.recurringEnabled,
      integrationVersion3ds: opts.integrationVersion3ds,
      worldpay3dsFlex: opts.worldpay3dsFlex,
      credentials: opts.credentials,
      paymentProvider: opts.gateway,
      notificationCredentials: opts.notificationCredentials,
      ...opts.gatewayAccountCredentials && { gatewayAccountCredentials: opts.gatewayAccountCredentials },
      type: opts.type
    })
    const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      requires3ds: opts.requires3ds,
      allowMoto: opts.allowMoto,
      recurringEnabled: opts.recurringEnabled,
      integrationVersion3ds: opts.integrationVersion3ds,
      worldpay3dsFlex: opts.worldpay3dsFlex,
      credentials: opts.credentials,
      paymentProvider: opts.gateway,
      notificationCredentials: opts.notificationCredentials,
      ...opts.gatewayAccountCredentials && { gatewayAccountCredentials: opts.gatewayAccountCredentials },
      type: opts.type
    })

    return [
      user,
      gatewayAccount,
      gatewayAccountByExternalId
    ]
  }

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('When using a sandbox account', () => {
    it('should not show link to Your PSP in the side navigation', () => {
      cy.task('setupStubs', getUserAndGatewayAccountStubs())
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('#navigation-menu-your-psp').should('have.length', 0)
    })
  })

  describe('When using a Worldpay account', () => {
    const gatewayAccountOpts = {
      gateway: 'worldpay',
      emptyCredentials: true,
      gatewayAccountCredentials: [{
        payment_provider: 'worldpay',
        external_id: credentialExternalId,
        id: credentialsId,
        state: 'CREATED',
        credentials: {}
      }]
    }

    it('should show link to "Your PSP - Worldpay" in the side navigation and render page when clicked', () => {
      cy.task('setupStubs', getUserAndGatewayAccountStubs(gatewayAccountOpts))
      cy.visit(`/account/${gatewayAccountExternalId}/settings`)
      cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Worldpay')
      cy.get('#navigation-menu-your-psp').click()

      cy.get('.value-merchant-id').should('contain', 'Not configured')
      cy.get('.value-username').should('contain', 'Not configured')
      cy.get('.value-password').should('contain', 'Not configured')
      cy.get('.value-organisational-unit-id').should('contain', 'Not configured')
      cy.get('.value-issuer').should('contain', 'Not configured')
      cy.get('.value-jwt-mac-key').should('contain', 'Not configured')
    })

    it('should allow account credentials to be configured and all values must be set', () => {
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(gatewayAccountOpts),
        gatewayAccountStubs.postCheckWorldpayCredentials({ ...testCredentials, gatewayAccountId }),
        gatewayAccountStubs.patchUpdateWorldpayOneOffCredentialsSuccess({
          gatewayAccountId,
          credentialId: credentialsId,
          userExternalId,
          credentials: testCredentials
        })
      ])
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').type(testCredentials.merchant_code)
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
      cy.task('setupStubs', getUserAndGatewayAccountStubs(gatewayAccountOpts))
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').type('merchant-account-code-ending-with-MOTO')
      cy.get('#username').type(testCredentials.username)
      cy.get('#password').type(testCredentials.password)
      cy.get('#submitCredentials').click()
      cy.get('.govuk-error-summary').should('have.length', 1)
      cy.get('ul.govuk-error-summary__list > li:nth-child(1) > a').should('contain', 'MOTO merchant code not allowed. Please contact support if you would like MOTO payments enabled')
    })

    it('should allow 3DS Flex credentials to be configured (trimming leading and trailing space) and all values must be valid and set', () => {
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(gatewayAccountOpts),
        gatewayAccountStubs.postCheckWorldpay3dsFlexCredentials({ gatewayAccountId, result: 'valid' }),
        gatewayAccountStubs.postUpdateWorldpay3dsFlexCredentials({ gatewayAccountId, ...testFlexCredentials }),
        gatewayAccountStubs.patchUpdate3dsVersionSuccess(gatewayAccountId, 2)
      ])
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
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(gatewayAccountOpts),
        gatewayAccountStubs.postCheckWorldpay3dsFlexCredentials({
          gatewayAccountId: gatewayAccountId,
          result: 'invalid',
          organisational_unit_id: '5bd9b55e4444761ac0af1c81',
          issuer: '5bd9e0e4444dce153428c941',
          jwt_mac_key: 'ffffffff-aaaa-1111-1111-52805d5cd9e1'
        })
      ])
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
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

    it('should display generic problem page when getting a bad result from connector', () => {
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(gatewayAccountOpts),
        gatewayAccountStubs.postCheckWorldpay3dsFlexCredentialsWithBadResult({
          gatewayAccountId: gatewayAccountId, ...testBadResultFlexCredentials
        })
      ])
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
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
      const merchantCode = 'a-merchant-code'
      const username = 'a-username'
      cy.task('setupStubs', getUserAndGatewayAccountStubs({
        gateway: 'worldpay',
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: {
            one_off_customer_initiated: {
              merchant_code: merchantCode,
              username: username
            }
          },
          external_id: credentialExternalId,
          id: credentialsId
        }],
        requires3ds: true,
        worldpay3dsFlex: testFlexCredentials
      }))

      cy.visit(`${yourPspPath}/${credentialExternalId}`)

      cy.get('.value-merchant-id').should('contain', merchantCode)
      cy.get('.value-username').should('contain', username)
      cy.get('.value-password').should('contain', '●●●●●●●●')
      cy.get('.value-organisational-unit-id').should('contain', testFlexCredentials.organisational_unit_id)
      cy.get('.value-issuer').should('contain', testFlexCredentials.issuer)
      cy.get('.value-jwt-mac-key').should('contain', '●●●●●●●●')

      cy.get('#flex-credentials-change-link').click()
    })
  })

  describe('When using a Worldpay account with MOTO enabled', () => {
    const gatewayAccountOpts = {
      gateway: 'worldpay',
      requires3ds: true,
      allowMoto: true,
      integrationVersion3ds: 1,
      gatewayAccountCredentials: [{
        payment_provider: 'worldpay',
        credentials: {},
        external_id: credentialExternalId,
        id: credentialsId
      }],
      validateCredentials: testCredentialsMOTO
    }

    it('should not have 3DS flex section', () => {
      cy.task('setupStubs', getUserAndGatewayAccountStubs(gatewayAccountOpts))
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('h2').contains('3DS Flex').should('not.exist')
      cy.get('#worldpay-3ds-flex-is-off').should('not.exist')
      cy.get('#worldpay-3ds-flex-is-off').should('not.exist')
      cy.get('#worldpay-3ds-flex-is-on').should('not.exist')
    })

    it('should not allow non-MOTO merchant account code', () => {
      cy.task('setupStubs', getUserAndGatewayAccountStubs(gatewayAccountOpts))
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
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(gatewayAccountOpts),
        gatewayAccountStubs.postCheckWorldpayCredentials({ ...testCredentialsMOTO, gatewayAccountId }),
        gatewayAccountStubs.patchUpdateWorldpayOneOffCredentialsSuccess({
          gatewayAccountId,
          credentialId: credentialsId,
          userExternalId,
          credentials: testCredentialsMOTO
        })
      ])
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').clear()
      cy.get('#merchantId').type(testCredentialsMOTO.merchant_code)
      cy.get('#username').type(testCredentialsMOTO.username)
      cy.get('#password').type(testCredentialsMOTO.password)
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
      cy.get('h1').contains('Your payment service provider (PSP) - Worldpay').should('exist')
    })

    it('should allow MOTO merchant account code ending MOTOGBP', () => {
      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs(gatewayAccountOpts),
        gatewayAccountStubs.postCheckWorldpayCredentials({ ...testCredentialsMOTOGBP, gatewayAccountId }),
        gatewayAccountStubs.patchUpdateWorldpayOneOffCredentialsSuccess({
          gatewayAccountId,
          credentialId: credentialsId,
          userExternalId,
          credentials: testCredentialsMOTOGBP
        })
      ])
      cy.visit(`${yourPspPath}/${credentialExternalId}`)
      cy.get('#credentials-change-link').click()
      cy.get('#merchantId').clear()
      cy.get('#merchantId').type(testCredentialsMOTOGBP.merchant_code)
      cy.get('#username').type(testCredentialsMOTOGBP.username)
      cy.get('#password').type(testCredentialsMOTOGBP.password)
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
      cy.get('h1').contains('Your payment service provider (PSP) - Worldpay').should('exist')
    })
  })

  describe('When using a Worldpay account with recurring payments enabled', () => {
    it('should render the page correctly when there are no existing credentials', () => {
      cy.task('setupStubs', getUserAndGatewayAccountStubs({
        gateway: 'worldpay',
        requires3ds: true,
        recurringEnabled: true,
        integrationVersion3ds: 1,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: {},
          external_id: credentialExternalId,
          id: credentialsId
        }]
      }))

      cy.visit(`${yourPspPath}/${credentialExternalId}`)

      cy.get('[data-cy=cit-credentials-summary-list]').within(() => {
        cy.get('.value-merchant-id').should('contain', 'Not configured')
        cy.get('.value-username').should('contain', 'Not configured')
        cy.get('.value-password').should('contain', 'Not configured')
      })

      cy.get('[data-cy=mit-credentials-summary-list]').within(() => {
        cy.get('.value-merchant-id').should('contain', 'Not configured')
        cy.get('.value-username').should('contain', 'Not configured')
        cy.get('.value-password').should('contain', 'Not configured')
      })

      cy.get('[data-cy=worldpay-flex-settings-summary-list]').within(() => {
        cy.get('.value-organisational-unit-id').should('contain', 'Not configured')
        cy.get('.value-issuer').should('contain', 'Not configured')
        cy.get('.value-jwt-mac-key').should('contain', 'Not configured')
      })
    })

    it('should render the page correctly when there are existing credentials', () => {
      const citMerchantCode = 'a-cit-merchant-code'
      const mitMerchantCode = 'a-mit-merchant-code'

      const citUsername = 'a-cit-username'
      const mitUsername = 'a-mit-username'

      cy.task('setupStubs', getUserAndGatewayAccountStubs({
        gateway: 'worldpay',
        requires3ds: true,
        recurringEnabled: true,
        integrationVersion3ds: 1,
        gatewayAccountCredentials: [{
          payment_provider: 'worldpay',
          credentials: {
            recurring_customer_initiated: {
              merchant_code: citMerchantCode,
              username: citUsername
            },
            recurring_merchant_initiated: {
              merchant_code: mitMerchantCode,
              username: mitUsername
            }
          },
          external_id: credentialExternalId,
          id: credentialsId
        }],
        worldpay3dsFlex: testFlexCredentials
      }))

      cy.visit(`${yourPspPath}/${credentialExternalId}`)

      cy.get('[data-cy=cit-credentials-summary-list]').within(() => {
        cy.get('.value-merchant-id').should('contain', citMerchantCode)
        cy.get('.value-username').should('contain', citUsername)
        cy.get('.value-password').should('contain', '●●●●●●●●')
      })

      cy.get('[data-cy=mit-credentials-summary-list]').within(() => {
        cy.get('.value-merchant-id').should('contain', mitMerchantCode)
        cy.get('.value-username').should('contain', mitUsername)
        cy.get('.value-password').should('contain', '●●●●●●●●')
      })

      cy.get('[data-cy=worldpay-flex-settings-summary-list]').within(() => {
        cy.get('.value-organisational-unit-id').should('contain', testFlexCredentials.organisational_unit_id)
        cy.get('.value-issuer').should('contain', testFlexCredentials.issuer)
        cy.get('.value-jwt-mac-key').should('contain', '●●●●●●●●')
      })
    })

    it('should link to and appropriately pre-populate the pages for updating recurring merchant details', () => {
      const citMerchantCode = 'a-cit-merchant-code'
      const mitMerchantCode = 'a-mit-merchant-code'

      const citUsername = 'a-cit-username'
      const mitUsername = 'a-mit-username'

      const validateCredentials = {
        merchant_code: citMerchantCode,
        username: citUsername,
        password: 'a-password'
      }

      cy.task('setupStubs', [
        ...getUserAndGatewayAccountStubs({
          gateway: 'worldpay',
          requires3ds: true,
          recurringEnabled: true,
          integrationVersion3ds: 1,
          gatewayAccountCredentials: [{
            payment_provider: 'worldpay',
            credentials: {
              recurring_customer_initiated: {
                merchant_code: citMerchantCode,
                username: citUsername
              },
              recurring_merchant_initiated: {
                merchant_code: mitMerchantCode,
                username: mitUsername
              }
            },
            external_id: credentialExternalId,
            id: credentialsId
          }],
          worldpay3dsFlex: testFlexCredentials,
          validateCredentials
        }),
        gatewayAccountStubs.postCheckWorldpayCredentials({ ...validateCredentials, gatewayAccountId }),
        gatewayAccountStubs.patchUpdateWorldpayOneOffCredentialsSuccess({
          gatewayAccountId,
          credentialId: credentialsId,
          userExternalId,
          path: 'credentials/worldpay/recurring_customer_initiated',
          credentials: validateCredentials
        })
      ])

      cy.visit(`${yourPspPath}/${credentialExternalId}`)

      cy.get('#mit-credentials-change-link').click()

      cy.get('h1').should('contain', 'Recurring merchant initiated transaction (MIT) credentials')
      cy.get('#merchantId').should('have.value', mitMerchantCode)
      cy.get('#username').should('have.value', mitUsername)

      cy.get('.govuk-back-link').click()

      cy.get('#cit-credentials-change-link').click()

      cy.get('h1').should('contain', 'Recurring customer initiated transaction (CIT) credentials')
      cy.get('#merchantId').should('have.value', citMerchantCode)
      cy.get('#username').should('have.value', citUsername)

      cy.get('#password').type('a-password')
      cy.get('#submitCredentials').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`${yourPspPath}/${credentialExternalId}`)
      })
      cy.get('h1').contains('Your payment service provider (PSP) - Worldpay').should('exist')
    })
  })
})
