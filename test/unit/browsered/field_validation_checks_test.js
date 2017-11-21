'use strict'

// NPM dependencies
const {expect} = require('chai')

// Local dependencies
const {isBelowMaxAmount} = require('../../../app/browsered/field-validation-checks')

describe('field validation checks', () => {
  describe('isBelowMaxAmount', () => {
    it('should return an error string if it is passed an currency string exceeding £10 million', () => {
      expect(isBelowMaxAmount('10000000.01')).to.equal(`Choose an amount under £10,000,000`)
    })

    it('should not return false if it is not passed an currency string', () => {
      expect(isBelowMaxAmount('10,000,000 pounds sterling')).to.equal(false)
    })
  })
})
