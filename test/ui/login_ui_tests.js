let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
let paths = require('../../app/paths.js')

describe('Login view', function () {
  it('should render the right messaging when there are errors with user information', function () {
    let templateDate = {
      flash: {
        error: {
          messages: {
            username: 'You must enter a username',
            password: 'You must enter a password'
          }
        }
      }
    }

    let body = renderTemplate('login/login', templateDate)
    body.should.containSelector('.error-summary-heading')
    body.should.containSelector('label[for="username"] .error-message').withText(templateDate.flash.error.messages.username)
    body.should.containSelector('label[for="password"] .error-message').withText(templateDate.flash.error.messages.password)
  })

  it('should render send otp code form', function (done) {
    let templateData = {
    }

    let body = renderTemplate('login/otp-login', templateData)

    body.should.containSelector('h1').withExactText('Check your phone')

    body.should.containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn)
    body.should.containSelector('input#sms_code').withAttribute('value', '')

    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withExactText('Not received a text message?')
    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withAttribute('href', paths.user.otpSendAgain)

    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withExactText('Cancel')
    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withAttribute('href', paths.user.logOut)

    done()
  })

  it('should render send otp code form with error message', function (done) {
    let templateData = {
      flash: {
        error: 'Invalid security code'
      }
    }

    let body = renderTemplate('login/otp-login', templateData)

    body.should.containSelector('h1').withExactText('Check your phone')

    body.should.containSelector('.error-message').withExactText('Invalid security code')

    body.should.containSelector('form#otp-login-form').withAttribute('action', paths.user.otpLogIn)
    body.should.containSelector('input#sms_code').withAttribute('value', '')

    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withExactText('Not received a text message?')
    body.should.containSelector('div#display-otp-login > p:nth-child(3) > a').withAttribute('href', paths.user.otpSendAgain)

    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withExactText('Cancel')
    body.should.containSelector('div#display-otp-login > p:nth-child(4) > a').withAttribute('href', paths.user.logOut)

    done()
  })
})
