'use strict'

const { expect } = require('chai')

const { isNotAccountNumber } = require('../../../app/browsered/field-validation-checks')

describe('isNotValidAccountNumber', () => {
  it('should validate successfully for 8 digits', () => {
    const accountNumber = '00012345'

    expect(isNotAccountNumber(accountNumber)).to.be.false // eslint-disable-line
  })

  it('should validate successfully for 6 digits', () => {
    const accountNumber = '012345'

    expect(isNotAccountNumber(accountNumber)).to.be.false // eslint-disable-line
  })

  it('should validate successfully for 7 digits', () => {
    const accountNumber = '0012345'

    expect(isNotAccountNumber(accountNumber)).to.be.false // eslint-disable-line
  })

  it('should be not valid when is not a number', () => {
    const accountNumber = 'abcdefgh'

    expect(isNotAccountNumber(accountNumber)).to.be.equal('Enter a valid account number')
  })

  it('should be not valid when is too short', () => {
    const accountNumber = '12345'

    expect(isNotAccountNumber(accountNumber)).to.be.equal('Enter a valid account number')
  })

  it('should be not valid when is too long', () => {
    const accountNumber = '123456789'

    expect(isNotAccountNumber(accountNumber)).to.be.equal('Enter a valid account number')
  })
})
