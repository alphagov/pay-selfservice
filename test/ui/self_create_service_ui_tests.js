'use strict'

// Custom dependencies
const renderTemplate = require('../test_helpers/html_assertions').render
const paths = require('../../app/paths')

describe('Self-create service view', function () {
  it('should render create an account form', function (done) {
    const templateData = {}

    const body = renderTemplate('self_create_service/register', templateData)

    body.should.containSelector('h1').withExactText('Create an account')

    body.should.containSelector('form#submit-service-creation').withAttribute('action', paths.selfCreateService.register)
    body.should.containInputField('email', 'email')
    body.should.containInputField('telephone-number', 'tel')
    body.should.containInputField('password', 'password')

    done()
  })

  it('should render email sent page', function (done) {
    const email = 'bob@example.com'
    const templateData = {
      requesterEmail: email
    }

    const body = renderTemplate('self_create_service/confirm', templateData)

    body.should.containSelector('h1').withExactText('Check your email')
    body.should.containSelector('div#display-email-sent > p:nth-child(2)').withExactText(`An email has been sent to ${email}.`)
    body.should.containSelector('div#display-email-sent > p:nth-child(3)').withExactText('Click the link in the email to continue your registration.')

    done()
  })

  it('should render otp verify form', function (done) {
    const templateData = {}

    const body = renderTemplate('self_create_service/verify_otp', templateData)

    body.should.containSelector('h1').withExactText('Check your phone')

    body.should.containSelector('.govuk-body:first-of-type').withExactText(`We’ve sent you a text message with a security code`)
    body.should.containSelector('form#verify-phone-form').withAttribute('action', paths.selfCreateService.otpVerify)
    body.should.containInputField('verify-code', 'text')

    body.should.containSelector('.govuk-body:last-of-type > a').withExactText('Not received a text message?')

    done()
  })

  it('should render name your service form', function (done) {
    const serviceName = 'My Service name'
    const templateData = {
      serviceName
    }

    const body = renderTemplate('self_create_service/set_name', templateData)

    body.should.containSelector('h1').withExactText('What service will you be taking payments for?')

    body.should.containInputField('service-name', 'text').withAttribute('value', serviceName)
    body.should.containSelector('form#name-your-service-form').withAttribute('action', paths.selfCreateService.serviceNaming)

    done()
  })

  it('should render otp resend form', function (done) {
    const telephoneNumber = '07812345678'
    const templateData = {
      telephoneNumber: telephoneNumber
    }

    const body = renderTemplate('self_create_service/resend_otp', templateData)

    body.should.containSelector('h1').withExactText('Check your mobile number')

    body.should.containSelector('form#otp-resend-form').withAttribute('action', paths.selfCreateService.otpResend)
    body.should.containInputField('telephone-number', 'tel').withAttribute('value', telephoneNumber)

    done()
  })
})
