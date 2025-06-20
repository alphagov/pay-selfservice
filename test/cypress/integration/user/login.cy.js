const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Login Page', () => {
  const gatewayAccountId = 42
  const gatewayAccountExternalId = '101ece30d2ca4b868baca5677c41ef5f' // pragma: allowlist secret
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const serviceExternalId = 'service123abc'
  const accountType = 'test'
  const validEmail = 'some-user@example.com'
  const validPassword = 'some-valid-password'
  const invalidPassword = 'some-invalid-password'
  const invalidCode = '654321'
  const validCode = '123456'

  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName: 'service-name', serviceExternalId }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, accountType),
      userStubs.postUserAuthenticateSuccess(userExternalId, validEmail, validPassword),
      userStubs.postUserAuthenticateInvalidPassword(validEmail, invalidPassword),
      userStubs.postSecondFactorSuccess(userExternalId),
      userStubs.postAuthenticateSecondFactorInvalidCode(userExternalId, invalidCode),
      userStubs.postAuthenticateSecondFactorSuccess(userExternalId, validCode)
    ])

    cy.visit('/')
  })

  describe('Page content', () => {
    it('should have the page title \'Sign in to GOV.UK Pay\'', () => {
      cy.title().should('eq', 'Sign in to GOV.UK Pay')
    })

    it('should redirect to the login page', () => {
      cy.url().should('include', '/login')
    })

    it('should have a link to the register page', () => {
      cy.contains('create one now').should('have.attr', 'href', '/register/email-address')
    })

    it('should have a link to the forgotten password page', () => {
      cy.contains('Forgot your password?').should('have.attr', 'href', '/reset-password')
    })

    it('should display the footer correctly when logged out', () => {
      cy.log('should display the About section with 6 links')

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__section')
        .contains('About')
        .parent()
        .find('a')
        .should('have.length', 6)

      cy.log('should display the Support section with 4 links')

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__section')
        .contains('Support')
        .parent()
        .find('a')
        .should('have.length', 4)
    
      cy.log('should not display Legal terms when logged out')
      
      cy.get('[data-cy=footer]')
        .find('.govuk-footer__section')
        .should('not.contain', 'Legal Terms')
    })
  })

  describe('Valid username/password', () => {
    it('should log user in', () => {
      cy.visit('/')

      // enter a valid username and password and submit
      cy.getCookie('session')
      cy.get('#username').type(validEmail)
      cy.get('#password').type(validPassword)
      cy.contains('Continue').click()

      // should redirect to security code page
      cy.title().should('eq', 'Enter security code - GOV.UK Pay')
      cy.url().should('include', '/otp-login')

      // enter an invalid security code
      cy.get('#sms_code').type(invalidCode)
      cy.get('button').contains('Continue').click()

      cy.contains('There is a problem')
      cy.get('.govuk-error-summary__list>li').should('have.length', 1)
      cy.get('.govuk-error-summary__list>li').first()
        .contains('The security code you’ve used is incorrect or has expired')
        .should('have.attr', 'href', '#sms_code')
      cy.get('#sms_code').parent().get('.govuk-error-message')
        .contains('The security code you’ve used is incorrect or has expired')

      // enter a valid code and submit
      cy.get('#sms_code').type(validCode)
      cy.get('button').contains('Continue').click()

      // should redirect to my services page
      cy.title().should('eq', 'My services - GOV.UK Pay')
    })
  })

  describe('Invalid username/password', () => {
    it('should show inline errors if no password is supplied', () => {
      cy.get('#username').type('fake@example.com')
      cy.contains('Continue').click()
      cy.contains('There is a problem')
      cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
      cy.get('[data-cy=error-summary-list-item]').first()
        .contains('Enter a password')
        .should('have.attr', 'href', '#password')
      cy.get('.govuk-error-message')
        .contains('Enter a password')
    })

    it('should show inline errors if no email address is supplied', () => {
      cy.get('#password').type('sup3r-s3cur3-pa$$w0rd')
      cy.contains('Continue').click()
      cy.contains('There is a problem')
      cy.get('[data-cy=error-summary-list-item]').should('have.length', 1)
      cy.get('[data-cy=error-summary-list-item]').first()
        .contains('Enter an email address')
        .should('have.attr', 'href', '#username')
      cy.get('.govuk-error-message')
        .contains('Enter an email address')
    })

    it('should deny access to selfservice if the password is incorrect', () => {
      cy.get('#username').type(validEmail)
      cy.get('#password').type(invalidPassword)
      cy.contains('Continue').click()
      cy.title().should('eq', 'Sign in to GOV.UK Pay')
      cy.url().should('include', '/login')
    })
  })

  describe('login redirects', () => {
    it('should redirect to original destination if user is not logged in', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

      cy.location('pathname').should('eq', '/login')

      // enter a valid username and password and submit
      cy.getCookie('session')
      cy.get('#username').type(validEmail, { delay: 0 })
      cy.get('#password').type(validPassword, { delay: 0 })
      cy.contains('Continue').click()

      // should redirect to security code page
      cy.title().should('eq', 'Enter security code - GOV.UK Pay')
      cy.location('pathname').should('eq', '/otp-login')

      // enter a valid code and submit
      cy.get('#sms_code').type(validCode, { delay: 0 })
      cy.get('button').contains('Continue').click()

      // should redirect to account dashboard page
      cy.location('pathname').should('eq', `/service/${serviceExternalId}/account/${accountType}/dashboard`)
      cy.title().should('eq', 'Dashboard - service-name - GOV.UK Pay')
    })
  })
})
