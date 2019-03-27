'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const companyNumberValidations = require('./company-number-validations')

describe.only('Company number validations', () => {
  it('should not be valid when mandatory text is blank', () => {
    expect(companyNumberValidations.validateCompanyNumber('')).to.deep.equal({
      valid: false,
      message: 'This field cannot be blank'
    })
  })

  // TODO
  // implement the rest of the tests once we have the validation implemented
})
