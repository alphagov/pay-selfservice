'use strict'

const { expect } = require('chai')

const companyNumberValidations = require('./company-number-validations')

// Constants
const validCompanyNumber = '01234567'
const invalidCompanyNumber = '¯\\_(ツ)_/¯'

describe('company number validations', () => {
  it('should validate successfully', () => {
    expect(companyNumberValidations.validateCompanyNumber(validCompanyNumber).valid).to.be.true // eslint-disable-line
  })

  it('should not be valid when blank', () => {
    expect(companyNumberValidations.validateCompanyNumber('')).to.deep.equal({
      valid: false,
      message: 'This field cannot be blank'
    })
  })

  it('should not be valid when company number is invalid', () => {
    expect(companyNumberValidations.validateCompanyNumber(invalidCompanyNumber)).to.deep.equal({
      valid: false,
      message: 'Enter a valid company number'
    })
  })
})
