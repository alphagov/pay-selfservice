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
      const validPhoneNumber = '01234567890'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided details valid for phone number with spaces', function (done) {
      const validPhoneNumber = '0123 4567 890'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided phone number invalid', function (done) {
      const validPhoneNumber = '(0)1234567890'
      const validPassword = 'dnvlkHdPlfw8e_+@!'
      validation.validateUserRegistrationInputs(validPhoneNumber, validPassword)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid phone number')
        })
        .should.notify(done)
    })

    it('should invalidate if the provided password null/undefined', function (done) {
      const validPhoneNumber = '01234567890'
      const password = undefined
      validation.validateUserRegistrationInputs(validPhoneNumber, password)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Your password must be at least 10 characters.')
        })
        .should.notify(done)
    })

    it('should invalidate if the provided password a common password', function (done) {
      const validPhoneNumber = '01234567890'
      const password = '1234567890'
      validation.validateUserRegistrationInputs(validPhoneNumber, password)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('The password you tried to create contains a common phrase or combination of characters. Choose something that’s harder to guess.')
        })
        .should.notify(done)
    })

    it('should invalidate if the provided password invalid if its too short', function (done) {
      const validPhoneNumber = '01234567890'
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
      const validPhoneNumber = '01234567890'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.fulfilled
        .notify(done)
    })

    it('should find the provided phone number invalid', function (done) {
      const validPhoneNumber = '(0)1234567890'

      validation.validateRegistrationTelephoneNumber(validPhoneNumber)
        .should.be.rejected.then((response) => {
          expect(response).to.equal('Invalid phone number')
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
      const telephoneNumber = '07512345678'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.fulfilled
        .notify(done)
    })

    it('should be rejected if email is not valid', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '07512345678'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if email is missing', function (done) {
      const email = ''
      const telephoneNumber = '07512345678'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should be rejected if telephone number is not valid', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '0751234567'
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

    it('should be rejected if password is not valid', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '07512345678'
      const password = 'password1234'

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })

    it('should rejected if password is missing', function (done) {
      const email = 'me@gov'
      const telephoneNumber = '07512345678'
      const password = ''

      validation.validateServiceRegistrationInputs(email, telephoneNumber, password)
        .should.be.rejected
        .notify(done)
    })
  })

  describe('validate service naming input', function () {
    it('should success if service name is valid', function (done) {
      const validServiceName = 'My Service name'

      validation.validateServiceNamingInputs(validServiceName).should.be.fulfilled.notify(done)
    })

    it('should error if service name is undefined', function (done) {
      const invalidServiceName = undefined

      validation.validateServiceNamingInputs(invalidServiceName).should.be.rejected.then(response => {
        expect(response).to.equal('Invalid service name')
      }).should.notify(done)
    })

    it('should error if service name is whitespace', function (done) {
      const invalidServiceName = ' '

      validation.validateServiceNamingInputs(invalidServiceName).should.be.rejected.then(response => {
        expect(response).to.equal('Invalid service name')
      }).should.notify(done)
    })
  })
})
