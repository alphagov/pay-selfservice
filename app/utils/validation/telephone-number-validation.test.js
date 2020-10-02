'use strict'

const { invalidTelephoneNumber } = require('./telephone-number-validation')

describe('telephone number validation', () => {
  it('should return false for telephone number with spaces', () => {
    const validPhoneNumber = '0113 496 0000'
    expect(invalidTelephoneNumber(validPhoneNumber)).toBe(false) // eslint-disable-line
  })

  it('should return false for telephone number with dashes', () => {
    const validPhoneNumber = '0113-496-0000'
    expect(invalidTelephoneNumber(validPhoneNumber)).toBe(false) // eslint-disable-line
  })

  it('should return false for telephone number with mixed format', () => {
    const validPhoneNumber = '(0113) 496 / 0000'
    expect(invalidTelephoneNumber(validPhoneNumber)).toBe(false) // eslint-disable-line
  })

  it(
    'should return false for telephone number with international mixed format',
    () => {
      const validPhoneNumber = '+36 / (1) 496 - 0000'
      expect(invalidTelephoneNumber(validPhoneNumber)).toBe(false) // eslint-disable-line
    }
  )

  it('should return true for invalid telephone number', () => {
    const validPhoneNumber = 'abc'
    expect(invalidTelephoneNumber(validPhoneNumber)).toBe(true) // eslint-disable-line
  })

  it('should return true for telephone number is less than 9 digits', () => {
    const validPhoneNumber = '12345678'
    expect(invalidTelephoneNumber(validPhoneNumber)).toBe(true) // eslint-disable-line
  })
})
