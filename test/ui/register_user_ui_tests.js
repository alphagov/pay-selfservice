let path = require('path')
let renderTemplate = require(path.join(__dirname, '/../test_helpers/html_assertions.js')).render
let paths = require('../../app/paths.js')

describe('Register user view', function () {
  it('should render create an account form', function (done) {
    let templateData = {
      email: 'invitee@example.com'
    }

    let body = renderTemplate('user_registration/register', templateData)

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.registerUser.registration)
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com')
    body.should.containSelector('input#telephone-number')
    body.should.containSelector('input#password')
    done()
  })

  it('should render create an account form with local telephone number pre-populated', function (done) {
    let templateData = {
      email: 'invitee@example.com',
      telephone_number: '01134960000'
    }

    let body = renderTemplate('user_registration/register', templateData)

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.registerUser.registration)
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com')
    body.should.containSelector('input#telephone-number')
      .withAttribute('value', '01134960000')
    done()
  })

  it('should render create an account form with international converted to numbers only telephone number pre-populated', function (done) {
    let templateData = {
      email: 'invitee@example.com',
      telephone_number: '+441134960000'
    }

    let body = renderTemplate('user_registration/register', templateData)

    body.should.containSelector('form#submit-registration').withAttribute('action', paths.registerUser.registration)
    body.should.containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com')
    body.should.containSelector('input#telephone-number')
      .withAttribute('value', '00441134960000')
    done()
  })

  it('should render verify telephone number view', function (done) {
    let templateData = {
      email: 'invitee@example.com'
    }

    let body = renderTemplate('user_registration/verify_otp', templateData)

    body.should.containSelector('form#verify-phone-form').withAttribute('action', paths.registerUser.otpVerify)
    body.should.containSelector('input#verify-code')
    done()
  })

  it('should render resend otp code view with local telephone number', function (done) {
    let telephoneNumber = '01134960000'

    let templateData = {
      telephone_number: telephoneNumber
    }

    let body = renderTemplate('user_registration/re_verify_phone', templateData)

    body.should.containSelector('form#otp-send-again').withAttribute('action', paths.registerUser.reVerifyPhone)
    body.should.containSelector('input#telephone-number').withAttribute('value', telephoneNumber)
    done()
  })

  it('should render resend otp code view with international converted to numbers only telephone number', function (done) {
    let templateData = {
      telephone_number: '+441134960000'
    }

    let body = renderTemplate('user_registration/re_verify_phone', templateData)

    body.should.containSelector('form#otp-send-again').withAttribute('action', paths.registerUser.reVerifyPhone)
    body.should.containSelector('input#telephone-number').withAttribute('value', '00441134960000')
    done()
  })
})
