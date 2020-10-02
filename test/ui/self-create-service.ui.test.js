'use strict'

const renderTemplate = require('../test-helpers/html-assertions').render
const paths = require('../../app/paths')

describe('Self-create service view', () => {
  it('should render create an account form', done => {
    const templateData = {}

    const body = renderTemplate('self-create-service/register', templateData)

    expect(body).containSelector('h1').withExactText('Create an account')

    expect(body).containSelector('form#submit-service-creation').withAttribute('action', paths.selfCreateService.register)
    expect(body).containInputField('email', 'email')
    expect(body).containInputField('telephone-number', 'tel')
    expect(body).containInputField('password', 'password')

    done()
  })

  it('should render email sent page', done => {
    const email = 'bob@example.com'
    const templateData = {
      requesterEmail: email
    }

    const body = renderTemplate('self-create-service/confirm', templateData)

    expect(body).containSelector('h1').withExactText('Check your email')
    expect(body).containSelector('div#display-email-sent > p:nth-child(2)').withExactText(`An email has been sent to ${email}.`)
    expect(body).containSelector('div#display-email-sent > p:nth-child(3)').withExactText('Click the link in the email to continue your registration.')

    done()
  })

  it('should render otp verify form', done => {
    const templateData = {}

    const body = renderTemplate('self-create-service/verify-otp', templateData)

    expect(body).containSelector('h1').withExactText('Check your phone')

    expect(body).containSelector('#display_otp_verify > .govuk-body:first-of-type').withExactText(`We’ve sent you a text message with a verification code`)
    expect(body).containSelector('form#verify-phone-form').withAttribute('action', paths.selfCreateService.otpVerify)
    expect(body).containInputField('verify-code', 'text')

    expect(body).containSelector('#display_otp_verify > .govuk-body:last-of-type > a').withExactText('Not received a text message?')

    done()
  })

  it('should render name your service form', done => {
    const serviceName = 'My Service name'
    const templateData = {
      serviceName
    }

    const body = renderTemplate('self-create-service/set-name', templateData)

    expect(body).containSelector('h1').withExactText('What service will you be taking payments for?')

    expect(body).containInputField('service-name', 'text').withAttribute('value', serviceName)
    expect(body).containSelector('form#name-your-service-form').withAttribute('action', paths.selfCreateService.serviceNaming)

    done()
  })

  it('should render otp resend form with local telephone number', done => {
    const telephoneNumber = '01134960000'
    const templateData = {
      telephoneNumber: telephoneNumber
    }

    const body = renderTemplate('self-create-service/resend-otp', templateData)

    expect(body).containSelector('h1').withExactText('Check your mobile number')

    expect(body).containSelector('form#otp-resend-form').withAttribute('action', paths.selfCreateService.otpResend)
    expect(body).containInputField('telephone-number', 'tel').withAttribute('value', telephoneNumber)

    done()
  })

  it(
    'should render otp resend form with international telephone number',
    done => {
      const templateData = {
        telephoneNumber: '+441134960000'
      }

      const body = renderTemplate('self-create-service/resend-otp', templateData)

      expect(body).containSelector('h1').withExactText('Check your mobile number')

      expect(body).containSelector('form#otp-resend-form').withAttribute('action', paths.selfCreateService.otpResend)
      expect(body).containInputField('telephone-number', 'tel').withAttribute('value', '+441134960000')

      done()
    }
  )
})
