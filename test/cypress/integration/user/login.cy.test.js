const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Login Page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const validUsername = 'some-user@example.com'
  const validPassword = 'some-valid-password'
  const invalidPassword = 'some-invalid-password'
  const invalidCode = '654321'
  const validCode = '123456'

  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName: 'service-name' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId }),
      userStubs.postUserAuthenticateSuccess(userExternalId, validUsername, validPassword),
      userStubs.postUserAuthenticateInvalidPassword(validUsername, invalidPassword),
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
      cy.contains('create one now').should('have.attr', 'href', '/create-service/register')
    })
    it('should have a link to the forgotten password page', () => {
      cy.contains('Forgot your password?').should('have.attr', 'href', '/reset-password')
    })
  })

  describe('Valid username/password', () => {
    it('should log user in', () => {
      cy.visit('/')

      // enter a valid username and password and submit
      cy.getCookie('session')
      cy.get('#username').type(validUsername)
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
      cy.get('#sms_code').parent().get(`.govuk-error-message`)
        .contains('The security code you’ve used is incorrect or has expired')

      // enter a valid code and submit
      cy.get('#sms_code').type(validCode)
      cy.get('button').contains('Continue').click()

      // should redirect to my services page
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
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
      cy.get(`.govuk-error-message`)
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
      cy.get(`.govuk-error-message`)
        .contains('Enter an email address')
    })

    it('should deny access to selfservice if the password is incorrect', () => {
      cy.get('#username').type(validUsername)
      cy.get('#password').type(invalidPassword)
      cy.contains('Continue').click()
      cy.title().should('eq', 'Sign in to GOV.UK Pay')
      cy.url().should('include', '/login')
    })
  })
})
