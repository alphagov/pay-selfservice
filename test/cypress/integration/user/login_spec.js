describe('Login Page', () => {
  beforeEach(() => {
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

    const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')
    const selfServiceDefaultUser = selfServiceUsers.config.users.filter(fil => fil.isPrimary === 'true')[0]

    describe('Valid submissions', () => {
      it('should progress to 2FA page if provided valid username and password', () => {
        cy.getCookie('session')
        cy.get('#username').type(selfServiceDefaultUser.username)
        cy.get('#password').type(selfServiceDefaultUser.valid_password)
        cy.contains('Continue').click()
        cy.title().should('eq', 'Enter security code - GOV.UK Pay')
        cy.url().should('include', '/otp-login')
      })
    })

    describe('Invalid submissions', () => {
      it('should show inline errors if no password is supplied', () => {
        cy.get('#username').type('fake@example.com')
        cy.contains('Continue').click()
        cy.contains('There was a problem with the details you gave for:')
        cy.get('.error-summary-list').should('have.length', 1)
        cy.get('.error-summary-list').first()
          .contains('Password')
          .should('have.attr', 'href', '#password')
        cy.get(`label[for='password']`)
          .children('.error-message')
          .contains('This field cannot be blank')
      })

      it('should show inline errors if no email address is supplied', () => {
        cy.get('#password').type('sup3r-s3cur3-pa$$w0rd')
        cy.contains('Continue').click()
        cy.contains('There was a problem with the details you gave for:')
        cy.get('.error-summary-list').should('have.length', 1)
        cy.get('.error-summary-list').first()
          .contains('Email address')
          .should('have.attr', 'href', '#username')
        cy.get(`label[for='username']`)
          .children('.error-message')
          .contains('This field cannot be blank')
      })

      it('should deny access to selfservice if the password is incorrect', () => {
        cy.get('#username').type(selfServiceDefaultUser.username)
        cy.get('#password').type(selfServiceDefaultUser.invalid_password)
        cy.contains('Continue').click()
        cy.title().should('eq', 'Sign in to GOV.UK Pay')
        cy.url().should('include', '/login')
      })

    })
  })
})
