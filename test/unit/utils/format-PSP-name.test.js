'use strict'

const { expect } = require('chai')

const formatPSPname = require('../../../app/utils/format-PSP-name')

describe('When a payment provider name is passed to the function', () => {
  it('it should convert it from all lowercase to capitalised', () => {
    expect(formatPSPname('worldpay')).to.equal('Worldpay')
  })
  it('unless it’s epdq when it should do something special', () => {
    expect(formatPSPname('epdq')).to.equal('ePDQ')
  })
})

describe('When undefined is passed to the function', () => {
  it('it should return empty', () => {
    expect(formatPSPname()).to.equal()
  })
})
