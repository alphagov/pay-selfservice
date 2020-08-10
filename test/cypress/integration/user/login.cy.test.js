const userStubs = require('../../utils/user-stubs')

describe('Login Page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const validUsername = 'some-user@example.com'
  const validPassword = 'some-valid-password'
  const invalidPassword = 'some-invalid-password'

  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName: 'service-name' }),
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      },
      {
        name: 'postUserAuthenticateSuccess',
        opts: {
          external_id: userExternalId,
          username: validUsername,
          password: validPassword
        }
      },
      {
        name: 'postUserAuthenticateInvalidPassword',
        opts: {
          username: validUsername,
          password: invalidPassword
        }
      },
      {
        name: 'postSecondFactorSuccess',
        opts: {
          external_id: userExternalId
        }
      }
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

  describe('Form validation', () => {
    describe('Valid submissions', () => {
      it('should progress to 2FA page if provided valid username and password', () => {
        cy.getCookie('session')
        cy.get('#username').type(validUsername)
        cy.get('#password').type(validPassword)
        cy.contains('Continue').click()
        cy.title().should('eq', 'Enter verification code - GOV.UK Pay')
        cy.url().should('include', '/otp-login')
      })
    })

    describe('Invalid submissions', () => {
      it('should show inline errors if no password is supplied', () => {
        cy.get('#username').type('fake@example.com')
        cy.contains('Continue').click()
        cy.contains('There was a problem with the details you gave for:')
        cy.get('.govuk-error-summary__list').should('have.length', 1)
        cy.get('.govuk-error-summary__list').first()
          .contains('Password')
          .should('have.attr', 'href', '#password')
        cy.get(`.govuk-error-message`)
          .contains('This field cannot be blank')
      })

      it('should show inline errors if no email address is supplied', () => {
        cy.get('#password').type('sup3r-s3cur3-pa$$w0rd')
        cy.contains('Continue').click()
        cy.contains('There was a problem with the details you gave for:')
        cy.get('.govuk-error-summary__list').should('have.length', 1)
        cy.get('.govuk-error-summary__list').first()
          .contains('Email address')
          .should('have.attr', 'href', '#username')
        cy.get(`.govuk-error-message`)
          .contains('This field cannot be blank')
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
})
