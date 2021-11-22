'use strict'

const { expect } = require('chai')

const vatNumberValidations = require('./vat-number-validations')

// Constants
const standardVatNumber = 'GB999 9999 73'
const invalidVatNumber = 'BADD000'
const invalidLongVatNumber = 'GB999 9999 7333333333333'

describe('VAT number validations', () => {
  it('should validate successfully', () => {
    expect(vatNumberValidations.validateVatNumber(standardVatNumber).valid).to.be.true // eslint-disable-line
  })

  it('should validate successfully when no vat number provided', () => {
    expect(vatNumberValidations.validateVatNumber('')).to.deep.equal({
      valid: false,
      message: 'Enter a VAT number'
    })
  })

  it('should not be valid when text is invalid VAT number', () => {
    expect(vatNumberValidations.validateVatNumber(invalidVatNumber)).to.deep.equal({
      valid: false,
      message: 'Enter a valid VAT number, including ‘GB’ at the start'
    })
  })

  it('should not be valid when text is too long', () => {
    expect(vatNumberValidations.validateVatNumber(invalidLongVatNumber)).to.deep.equal({
      valid: false,
      message: 'Enter a valid VAT number, including ‘GB’ at the start'
    })
  })

  it('should validate successfully when no vat number was chosen', () => {
    expect(vatNumberValidations.validateVatNumberDeclaration('false')).to.deep.equal({
      valid: true,
      message: null
    })
  })

  it('should not be valid if no option was chosen', () => {
    expect(vatNumberValidations.validateVatNumberDeclaration()).to.deep.equal({
      valid: false,
      message: 'You must answer this question'
    })
  })
})
