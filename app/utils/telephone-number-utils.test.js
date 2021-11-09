'use strict'

const { expect } = require('chai')

const { invalidTelephoneNumber, formatPhoneNumberWithCountryCode } = require('./telephone-number-utils')

describe('telephone number utils', () => {
  describe('telephone number validation', () => {
    it('should return false for telephone number with spaces', () => {
      const validPhoneNumber = '0113 496 0000'
      expect(invalidTelephoneNumber(validPhoneNumber)).to.be.false // eslint-disable-line
    })

    it('should return false for telephone number with dashes', () => {
      const validPhoneNumber = '0113-496-0000'
      expect(invalidTelephoneNumber(validPhoneNumber)).to.be.false // eslint-disable-line
    })

    it('should return false for telephone number with mixed format', () => {
      const validPhoneNumber = '(0113) 496 / 0000'
      expect(invalidTelephoneNumber(validPhoneNumber)).to.be.false // eslint-disable-line
    })

    it('should return false for telephone number with international mixed format', () => {
      const validPhoneNumber = '+36 / (1) 496 - 0000'
      expect(invalidTelephoneNumber(validPhoneNumber)).to.be.false // eslint-disable-line
    })

    it('should return true for invalid telephone number', () => {
      const validPhoneNumber = 'abc'
      expect(invalidTelephoneNumber(validPhoneNumber)).to.be.true // eslint-disable-line
    })

    it('should return true for telephone number is less than 9 digits', () => {
      const validPhoneNumber = '12345678'
      expect(invalidTelephoneNumber(validPhoneNumber)).to.be.true // eslint-disable-line
    })
  })

  describe('format phone number', () => {
    it('should return phone number with UK country code when input has spaces', () => {
      const phoneNumber = '0113 496 0000'
      expect(formatPhoneNumberWithCountryCode(phoneNumber)).to.equal('+44 113 496 0000')
    })

    it('should return phone number with UK country code when input does not have spaces', () => {
      const phoneNumber = '01134960000'
      expect(formatPhoneNumberWithCountryCode(phoneNumber)).to.equal('+44 113 496 0000')
    })

    it('should keep original international dialing code', () => {
      const phoneNumber = '+661134960000'
      expect(formatPhoneNumberWithCountryCode(phoneNumber)).to.equal('+66 1134 960 000')
    })
  })
})