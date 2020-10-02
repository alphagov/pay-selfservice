'use strict'

const vatNumberValidations = require('./vat-number-validations')

// Constants
const standardVatNumber = 'GB999 9999 73'
const invalidVatNumber = 'BADD000'
const invalidLongVatNumber = 'GB999 9999 7333333333333'

describe('VAT number validations', () => {
  it('should validate successfully', () => {
    expect(vatNumberValidations.validateVatNumber(standardVatNumber).valid).toBe(true) // eslint-disable-line
  })

  it('should not be valid when mandatory text is blank', () => {
    expect(vatNumberValidations.validateVatNumber('')).toEqual({
      valid: false,
      message: 'This field cannot be blank'
    })
  })

  it('should not be valid when mandatory text is invalid VAT number', () => {
    expect(vatNumberValidations.validateVatNumber(invalidVatNumber)).toEqual({
      valid: false,
      message: 'Enter a valid VAT number, including ‘GB’ at the start'
    })
  })

  it('should not be valid when mandatory text is too long', () => {
    expect(vatNumberValidations.validateVatNumber(invalidLongVatNumber)).toEqual({
      valid: false,
      message: 'Enter a valid VAT number, including ‘GB’ at the start'
    })
  })
})
