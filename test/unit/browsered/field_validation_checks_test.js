'use strict'

// NPM dependencies
const {expect} = require('chai')

// Local dependencies
const {isAboveMaxAmount, isPasswordLessThanTenChars} = require('../../../app/browsered/field-validation-checks')

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
})
