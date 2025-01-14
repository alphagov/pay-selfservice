'use strict'

const isAPotentialPAN = require('./is-a-potential-pan')
const { expect } = require('chai')

describe('Is A Potential card number', () => {
  it('should return true if reference is 15 digits passes luhn check', () => {
    expect(isAPotentialPAN('424242424242424')).to.equal(true)
  })
  it('should return true if reference is 16 digits passes luhn check', () => {
    expect(isAPotentialPAN('4242424242424242')).to.equal(true)
  })
  it('should return true if reference has characters [- or space] and passes luhn check', () => {
    expect(isAPotentialPAN('4242 4242 4242-42-42')).to.equal(true)
  })
  it('should return false if reference is less than 15 digits', () => {
    expect(isAPotentialPAN('42424242424242')).to.equal(false)
  })
  it('should return false if reference has more than 16 digits', () => {
    expect(isAPotentialPAN('4242 4242 4242 42')).to.equal(false)
  })
  it('should return false if reference fails luhn check', () => {
    expect(isAPotentialPAN('42424242424211')).to.equal(false)
  })
  it('should return false if reference has characters [- or space] and but fails luhn check', () => {
    expect(isAPotentialPAN('4242-4242-4242-11')).to.equal(false)
  })
  it('should return false for reference with characters', () => {
    expect(isAPotentialPAN('A12345678901234')).to.equal(false)
  })
})
