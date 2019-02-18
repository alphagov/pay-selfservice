'use strict'

// NPM dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const validation = require('../../../app/utils/registration_validations')

// Constants
const expect = chai.expect

// Global setup
chai.use(chaiAsPromised)

let mockRegisterAccountCookie

describe('registration_validation module', function () {
  describe('validate registration inputs', function () {
    it('should find the provided details valid', function (done) {
      const validPhoneNumber = '01134960000'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with spaces', function (done) {
      const validPhoneNumber = '0113 496 0000'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with dashes', function (done) {
      const validPhoneNumber = '0113-496-0000'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with mixed format', function (done) {
      const validPhoneNumber = '(0113) 496 / 0000'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with international mixed format', function (done) {
      const validPhoneNumber = '+44 / (113) 496 - 0000'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided telephone number invalid', function (done) {
      const validPhoneNumber = 'abc'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
        })
        .should.notify(done)
    })

    it('should find the provided telephone number missing', function (done) {
      const validPhoneNumber = ''
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
        })
        .should.notify(done)
    })

    it('should invalidate if the provided password null/undefined', function (done) {
      const validPhoneNumber = '01134960000'
      const password = undefined
      validation.validateUserRegistrationInputs(validPhoneNumber, password)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Your password must be at least 10 characters.')
        })
        .should.notify(done)
    })

    it('should invalidate if the provided password a common password', function (done) {
      const validPhoneNumber = '01134960000'
      const password = '1234567890'
      validation.validateUserRegistrationInputs(validPhoneNumber, password)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
        })
        .should.notify(done)
    })

    it('should invalidate if the provided password invalid if its too short', function (done) {
      const validPhoneNumber = '01134960000'
      const validPassword = '2se45&s'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Your password must be at least 10 characters.')
        })
        .should.notify(done)
    })
  })

  describe('validate data needed to proceed with user registration', function () {
    beforeEach((done) => {
      mockRegisterAccountCookie = {}
      done()
    })

    it('should success if both email and code are present', function (done) {
      mockRegisterAccountCookie.email = 'invitee@example.com'
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      validation.shouldProceedWithRegistration(mockRegisterAccountCookie)
        .should.be.fulfilled
        .notify(done)
    })

    it('should be rejected if cookie is undefined', function (done) {
      validation.shouldProceedWithRegistration(undefined)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if email is missing', function (done) {
      mockRegisterAccountCookie.code = 'nfjkh438rf3901jqf'

      validation.shouldProceedWithRegistration(mockRegisterAccountCookie)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if code is missing', function (done) {
      mockRegisterAccountCookie.email = 'invitee@example.com'

      validation.shouldProceedWithRegistration(mockRegisterAccountCookie)
        .should.be.rejected
        .notify(done)
    })
  })

  describe('validate telephone number input', function () {
    it('should find the provided details valid', function (done) {
      const validPhoneNumber = '01134960000'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with spaces', function (done) {
      const validPhoneNumber = '0113 496 0000'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with dashes', function (done) {
      const validPhoneNumber = '0113-496-0000'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with mixed format', function (done) {
      const validPhoneNumber = '(0113) 496 / 0000'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with international mixed format', function (done) {
      const validPhoneNumber = '+44 / (113) 496 - 0000'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided phone number invalid', function (done) {
      const validPhoneNumber = 'abc'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
        })
        .should.notify(done)
    })

    it('should find the provided phone number missing', function (done) {
      const validPhoneNumber = ''

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192')
        })
        .should.notify(done)
    })
  })

  describe('validate otp input', function () {
    it('should find otp valid', function (done) {
      const validOtp = '123456'

      validation.validateOtp(validOtp)
        .should.be.fulfilled
        .notify(done)
    })

    it('should error if otp is undefined', function (done) {
      const otp = undefined

      validation.validateOtp(otp)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid verification code')
        }).should.notify(done)
    })

    it('should error if otp is not a number', function (done) {
      const otp = 'werb37'

      validation.validateOtp(otp)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid verification code')
        }).should.notify(done)
    })
  })

  describe('validate data needed to proceed with service registration', function () {
    it('should success if email, telephone_number and password are present', function (done) {
      const email = 'me@gov.uk'
      const telephoneNumber = '01134960000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.fulfilled
        .notify(done)
    })

    it('should be rejected if email is not valid', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '01134960000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if email is missing', function (done) {
      const email = ''
      const telephoneNumber = '01134960000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should success if email, telephone_number and password are present', function (done) {
      const email = 'me@gov.uk'
      const telephoneNumber = '01134960000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for telephone number with spaces', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '0113 496 0000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should find the provided details valid for telephone number with dashes', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '0113-496-0000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should find the provided details valid for telephone number with mixed format', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '(0113) 496 / 0000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should find the provided details valid for telephone number with international mixed format', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '+44 / (113) 496 - 0000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should be rejected if password is not valid', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '01134960000'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if telephone number is missing', function (done) {
      const email = 'me@gov'
      const telephoneNumber = ''
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if password is missing', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '01134960000'
      const password = ''

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })
  })
})
