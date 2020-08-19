'use strict'

// NPM dependencies
const { expect } = require('chai')
const {
  penceToPounds,
  poundsToPence,
  penceToPoundsWithCurrency,
  safeConvertPoundsStringToPence
} = require('../../../app/utils/currency-formatter')

const validPenceAmount = 1050
const validPoundsAndPenceAmount = '10.50'
const validPoundsAndPenceAmountWithCurrency = '£10.50'
const invalidAmountWithoutDecimals = '10'
const invalidAmountWithOneDecimals = '10.5'
const invalidAmountWithLetter = '10.50g'

describe(`Pence to pounds`, () => {
  describe(`when given valid pence amount ${validPoundsAndPenceAmount}`, () => {
    it(`should return ${validPoundsAndPenceAmount}`, () => {
      expect(penceToPounds(validPenceAmount)).to.equal(validPoundsAndPenceAmount)
    })
  })
})

describe(`Pounds to pence`, () => {
  describe(`when given valid pounds amount ${validPoundsAndPenceAmount}`, () => {
    it(`should return ${validPenceAmount}`, () => {
      expect(poundsToPence(validPoundsAndPenceAmount)).to.equal('1050')
    })
  })
})

describe(`Pounds to pence with currency`, () => {
  describe(`when given valid pence amount ${validPenceAmount}`, () => {
    it(`should return ${validPoundsAndPenceAmountWithCurrency}`, () => {
      expect(penceToPoundsWithCurrency(validPenceAmount)).to.equal(validPoundsAndPenceAmountWithCurrency)
    })
  })
})

describe(`Sanitise pounds and pence user input`, () => {
  describe(`when given pounds and pence amount from user input ${validPoundsAndPenceAmount}`, () => {
    it(`should return ${validPenceAmount}`, () => {
      expect(safeConvertPoundsStringToPence(validPoundsAndPenceAmount)).to.equal(validPenceAmount)
    })
  })

  describe(`when given pounds from user input ${invalidAmountWithoutDecimals}`, () => {
    it(`should return ${validPenceAmount}`, () => {
      expect(safeConvertPoundsStringToPence(invalidAmountWithoutDecimals)).to.equal(1000)
    })
  })

  describe(`when given invalid pounds and pence from user input ${invalidAmountWithOneDecimals}`, () => {
    it(`should return ${validPenceAmount}`, () => {
      expect(safeConvertPoundsStringToPence(invalidAmountWithOneDecimals)).to.equal(validPenceAmount)
    })
  })

  describe(`when given invalid pounds and pence from user input ${invalidAmountWithLetter}`, () => {
    it(`should return ${validPenceAmount}`, () => {
      expect(safeConvertPoundsStringToPence(invalidAmountWithLetter)).to.equal(validPenceAmount)
    })
  })
})
