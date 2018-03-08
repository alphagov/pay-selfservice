'use strict'

// NPM dependencies
const {expect} = require('chai')
const currencyFormatter = require('../../../app/utils/currency_formatter')

const validStringWithTwoDecimals = '10.50'
const invalidStringWithoutDecimals = '10'
const invalidStringWithOneDecimals = '10.5'
const invalidStringWithLetter = '10.50g'

describe(`Currency formatter`, () => {
  describe(`when given valid currency string ${validStringWithTwoDecimals}`, () => {
    it(`should return ${validStringWithTwoDecimals}`, () => {
      expect(currencyFormatter(validStringWithTwoDecimals)).to.equal(validStringWithTwoDecimals)
    })
  })
  describe(`when given invalid currency string ${invalidStringWithoutDecimals}`, () => {
    it(`should return ${invalidStringWithoutDecimals + '.00'}`, () => {
      expect(currencyFormatter(invalidStringWithoutDecimals)).to.equal(invalidStringWithoutDecimals + '.00')
    })
  })
  describe(`when given invalid currency string ${invalidStringWithOneDecimals}`, () => {
    it(`should return ${validStringWithTwoDecimals}`, () => {
      expect(currencyFormatter(invalidStringWithOneDecimals)).to.equal(validStringWithTwoDecimals)
    })
  })
  describe(`when given invalid currency string ${invalidStringWithLetter}`, () => {
    it(`should return ${validStringWithTwoDecimals}`, () => {
      expect(currencyFormatter(invalidStringWithLetter)).to.equal(validStringWithTwoDecimals)
    })
  })
})
