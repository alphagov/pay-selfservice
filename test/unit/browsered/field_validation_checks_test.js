'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const {
  isAboveMaxAmount,
  isPasswordLessThanTenChars,
  isFieldGreaterThanMaxLengthChars,
  isNotAccountNumber,
  isNotSortCode
} = require('../../../app/browsered/field-validation-checks')

describe('field validation checks', () => {
  describe('isAboveMaxAmount', () => {
    it('should return an error string if it is passed an currency string exceeding £100 thousand', () => {
      expect(isAboveMaxAmount('10000000.01')).to.equal(`Choose an amount under £100,000`)
    })

    it('should not return false if it is not passed an currency string', () => {
      expect(isAboveMaxAmount('100,000 pounds sterling')).to.equal(false)
    })
  })
  describe('isPasswordLessThanTenChars', () => {
    it('should return an error string if it is passed a string 9 chars', () => {
      expect(isPasswordLessThanTenChars('012345678')).to.equal(`Choose a Password of 10 characters or longer`)
    })
    it('should return false if it is passed a string of 10 chars', () => {
      expect(isPasswordLessThanTenChars('0123456789')).to.equal(false)
    })
  })
  describe('isFieldGreaterThanMaxLengthChars', () => {
    it('should return an error if value passed is greater than max length as string', () => {
      expect(isFieldGreaterThanMaxLengthChars('123456', '5')).to.equal(`The text is too long`)
    })
    it('should return false if value passed is less/equal than max length as string', () => {
      expect(isFieldGreaterThanMaxLengthChars('12345', '5')).to.equal(false)
    })
    it('should return an error if value passed is greater than max length as number', () => {
      expect(isFieldGreaterThanMaxLengthChars('123456', 5)).to.equal(`The text is too long`)
    })
    it('should return false if value passed is less/equal than max length as number', () => {
      expect(isFieldGreaterThanMaxLengthChars('12345', 5)).to.equal(false)
    })
    it('should return false, ignoring the validation if max length is not numeric', () => {
      expect(isFieldGreaterThanMaxLengthChars('123456ABC', 'que')).to.equal(false)
    })
  })
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

  describe('isNotValidSortCode', () => {
    it('should validate successfully for 6 digits', () => {
      const sortCode = '108800'

      expect(isNotSortCode(sortCode)).to.be.false // eslint-disable-line
    })

    it('should validate successfully for 6 digits with dashes', () => {
      const sortCode = '10-88-00'

      expect(isNotSortCode(sortCode)).to.be.false // eslint-disable-line
    })

    it('should validate successfully for 6 digits with spaces', () => {
      const sortCode = '10 88 00'

      expect(isNotSortCode(sortCode)).to.be.false // eslint-disable-line
    })

    it('should validate successfully for 6 digits with mix of dashes and spaces', () => {
      const sortCode = '10-88 00'

      expect(isNotSortCode(sortCode)).to.be.false // eslint-disable-line
    })

    it('should validate successfully for 6 digits with random whitespace', () => {
      const sortCode = '1 0 88 00'

      expect(isNotSortCode(sortCode)).to.be.false // eslint-disable-line
    })

    it('should be not valid when is not a number', () => {
      const sortCode = 'abcdef'

      expect(isNotSortCode(sortCode)).to.be.equal('Enter a valid sort code')
    })

    it('should be not valid when is too short', () => {
      const sortCode = '12345'

      expect(isNotSortCode(sortCode)).to.be.equal('Enter a valid sort code')
    })

    it('should be not valid when is too long', () => {
      const sortCode = '1234567'

      expect(isNotSortCode(sortCode)).to.be.equal('Enter a valid sort code')
    })
  })
})
