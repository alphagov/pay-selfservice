'use strict'

const path = require('path')

const renderTemplate = require(path.join(__dirname, '/../test-helpers/html-assertions.js')).render
const paths = require('../../app/paths.js')

describe('Register user view', () => {
  it('should render create an account form', done => {
    const templateData = {
      email: 'invitee@example.com'
    }

    const body = renderTemplate('user-registration/register', templateData)

    expect(body).containSelector('form#submit-registration').withAttribute('action', paths.registerUser.registration)
    expect(body).containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com')
    expect(body).containSelector('input#telephone-number')
    expect(body).containSelector('input#password')
    done()
  })

  it(
    'should render create an account form with local telephone number pre-populated',
    done => {
      const templateData = {
        email: 'invitee@example.com',
        telephone_number: '01134960000'
      }

      const body = renderTemplate('user-registration/register', templateData)

      expect(body).containSelector('form#submit-registration').withAttribute('action', paths.registerUser.registration)
      expect(body).containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com')
      expect(body).containSelector('input#telephone-number')
        .withAttribute('value', '01134960000')
      done()
    }
  )

  it(
    'should render create an account form with international telephone number pre-populated',
    done => {
      const templateData = {
        email: 'invitee@example.com',
        telephone_number: '+441134960000'
      }

      const body = renderTemplate('user-registration/register', templateData)

      expect(body).containSelector('form#submit-registration').withAttribute('action', paths.registerUser.registration)
      expect(body).containSelector('p#email-display').withExactText('Your account will be created with this email: invitee@example.com')
      expect(body).containSelector('input#telephone-number')
        .withAttribute('value', '+441134960000')
      done()
    }
  )

  it('should render verify telephone number view', done => {
    const templateData = {
      email: 'invitee@example.com'
    }

    const body = renderTemplate('user-registration/verify-otp', templateData)

    expect(body).containSelector('form#verify-phone-form').withAttribute('action', paths.registerUser.otpVerify)
    expect(body).containSelector('input#verify-code')
    done()
  })

  it(
    'should render resend otp code view with local telephone number',
    done => {
      const telephoneNumber = '01134960000'

      const templateData = {
        telephone_number: telephoneNumber
      }

      const body = renderTemplate('user-registration/re-verify-phone', templateData)

      expect(body).containSelector('form#otp-send-again').withAttribute('action', paths.registerUser.reVerifyPhone)
      expect(body).containSelector('input#telephone-number').withAttribute('value', telephoneNumber)
      done()
    }
  )

  it(
    'should render resend otp code view with international telephone number',
    done => {
      const templateData = {
        telephone_number: '+441134960000'
      }

      const body = renderTemplate('user-registration/re-verify-phone', templateData)

      expect(body).containSelector('form#otp-send-again').withAttribute('action', paths.registerUser.reVerifyPhone)
      expect(body).containSelector('input#telephone-number').withAttribute('value', '+441134960000')
      done()
    }
  )
})
