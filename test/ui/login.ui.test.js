const path = require('path')
const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
const paths = require('../../app/paths.js')

describe('Login view', () => {
  describe('if using SMS', () => {
    it(
      'should render the right messaging when there are errors with user information',
      () => {
        const templateDate = {
          flash: {
            error: {
              messages: {
                username: 'You must enter a username',
                password: 'You must enter a password'
              }
            }
          }
        }

        const body = renderTemplate('login/login', templateDate)
        expect(body).containSelector('.govuk-error-summary__title')
        expect(body).containSelector('label[for="username"] + .govuk-error-message').withText(templateDate.flash.error.messages.username)
        expect(body).containSelector('label[for="password"] + .govuk-error-message').withText(templateDate.flash.error.messages.password)
      }
    )

    it('should render send otp code form', done => {
      const templateData = {
        authenticatorMethod: 'SMS'
      }

      const body = renderTemplate('login/otp-login', templateData)

      expect(body).containSelector('h1').withExactText('Check your phone')

      expect(body).containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn)

      expect(body).containSelector('.text-messsage-link').withExactText('Not received a text message?')
      expect(body).containSelector('.text-messsage-link').withAttribute('href', paths.user.otpSendAgain)

      expect(body).containSelector('.cancel-link').withExactText('Cancel')
      expect(body).containSelector('.cancel-link').withAttribute('href', paths.user.logOut)

      done()
    })

    it('should render send otp code form with error message', done => {
      const templateData = {
        authenticatorMethod: 'SMS',
        flash: {
          error: 'The verification code you’ve used is incorrect or has expired.'
        }
      }

      const body = renderTemplate('login/otp-login', templateData)

      expect(body).containSelector('h1').withExactText('Check your phone')

      expect(body).containSelector('.govuk-error-message').withExactText('Error: The verification code you’ve used is incorrect or has expired.')

      expect(body).containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn)

      expect(body).containSelector('.text-messsage-link').withExactText('Not received a text message?')
      expect(body).containSelector('.text-messsage-link').withAttribute('href', paths.user.otpSendAgain)

      expect(body).containSelector('.cancel-link').withExactText('Cancel')
      expect(body).containSelector('.cancel-link').withAttribute('href', paths.user.logOut)

      done()
    })
  })
  describe('if using an authenticator APP', () => {
    it(
      'should render the right messaging when there are errors with user information',
      () => {
        const templateDate = {
          flash: {
            error: {
              messages: {
                username: 'You must enter a username',
                password: 'You must enter a password'
              }
            }
          }
        }

        const body = renderTemplate('login/login', templateDate)
        expect(body).containSelector('.govuk-error-summary__title')
        expect(body).containSelector('label[for="username"] + .govuk-error-message').withText(templateDate.flash.error.messages.username)
        expect(body).containSelector('label[for="password"] + .govuk-error-message').withText(templateDate.flash.error.messages.password)
      }
    )

    it('should render send otp code form', done => {
      const templateData = {
        authenticatorMethod: 'APP'
      }

      const body = renderTemplate('login/otp-login', templateData)

      expect(body).containSelector('h1').withExactText('Use your authenticator app')

      expect(body).containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn)

      expect(body).containSelector('.cancel-link').withExactText('Cancel')
      expect(body).containSelector('.cancel-link').withAttribute('href', paths.user.logOut)

      done()
    })

    it('should render send otp code form with error message', done => {
      const templateData = {
        authenticatorMethod: 'APP',
        flash: {
          error: 'Invalid verification code'
        }
      }

      const body = renderTemplate('login/otp-login', templateData)

      expect(body).containSelector('h1').withExactText('Use your authenticator app')

      expect(body).containSelector('.govuk-error-message').withExactText('Error: Invalid verification code')

      expect(body).containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn)

      expect(body).containSelector('.cancel-link').withExactText('Cancel')
      expect(body).containSelector('.cancel-link').withAttribute('href', paths.user.logOut)

      done()
    })
  })
})
