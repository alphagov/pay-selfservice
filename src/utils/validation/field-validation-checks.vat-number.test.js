'use strict'

const { expect } = require('chai')
const { isNotVatNumber } = require('./field-validation-checks')

// helper function to parameterise test args for notVatNumber
const testIsNotVatNumber = ({ args, expected }) =>
  () => {
    args.forEach((testVal) => {
      const res = isNotVatNumber(testVal)
      expect(res).to.equal(expected)
    })
  }

describe('UK VAT number validations', () => {
  it('should validate standard VAT numbers', testIsNotVatNumber({ args: ['GB123456789', 'GB123 456 789', ' g B 1  23 456 7 8 9 ', '123456789'], expected: false }))

  it('should validate branch trader VAT numbers', testIsNotVatNumber({ args: ['GB123 456 789 123', ' gb 123 45678 91 2 3 ', '123456789123'], expected: false }))

  it('should validate government department VAT numbers', testIsNotVatNumber({ args: ['GBGD001', 'GD001', 'GD 001', ' gb G d 0 0 1 ', 'GD499'], expected: false }))

  it('should validate health authority VAT numbers', testIsNotVatNumber({ args: ['GBHA599', 'HA599', 'HA 599', ' g B hA 5 9 9 ', 'HA500'], expected: false }))

  it('should error if standard VAT numbers are too long or too short', testIsNotVatNumber({ args: ['GB99999997', 'GB9999999731', '9999997', '99999999997'], expected: true }))

  it('should error if branch trader VAT numbers are too long or too short', testIsNotVatNumber({ args: ['GB12345678912', 'GB1234567891234', '1234567891', '1234567891234'], expected: true }))

  it('should error if government department VAT numbers are too long or too short', testIsNotVatNumber({ args: ['GBGD12', 'GD4567', 'GBGD1000', 'GD4'], expected: true }))

  it('should error if health authority VAT numbers are too long or too short', testIsNotVatNumber({ args: ['GBHA5000', 'HA76', 'GBHA5', 'HA76767'], expected: true }))

  it('should error if government department VAT numbers don’t begin with GD0–4', testIsNotVatNumber({ args: ['GBGD789', 'GD666', 'GD500', 'GBGD999', '123'], expected: true }))

  it('should error if health authority VAT numbers don’t begin with HA5–9', testIsNotVatNumber({ args: ['GBHA499', 'HA000', 'HA123', 'GBHA499', '567'], expected: true }))

  it('should error if VAT prefixes are wrong', testIsNotVatNumber({ args: ['GC123456789', 'GBAD001', 'DCGD001', 'DG001', 'AH599', 'GFHA999', 'BG123456789'], expected: true }))

  it('should error if blank', testIsNotVatNumber({ args: [''], expected: true }))
})
