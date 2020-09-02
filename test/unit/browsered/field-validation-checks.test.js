'use strict'

const { expect } = require('chai')

const {
  isAboveMaxAmount,
  isPasswordLessThanTenChars,
  isFieldGreaterThanMaxLengthChars
} = require('../../../app/browsered/field-validation-checks')

describe('field validation checks', () => {
  describe('isAboveMaxAmount', () => {
    it('should return an error string if it is passed an currency string exceeding £100 thousand', () => {
      expect(isAboveMaxAmount('10000000.01')).to.equal(`Enter an amount under £100,000`)
    })

    it('should not return false if it is not passed an currency string', () => {
      expect(isAboveMaxAmount('100,000 pounds sterling')).to.equal(false)
    })
  })

  describe('isPasswordLessThanTenChars', () => {
    it('should return an error string if it is passed a string 9 chars', () => {
      expect(isPasswordLessThanTenChars('012345678')).to.equal('Password must be 10 characters or more')
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
})
