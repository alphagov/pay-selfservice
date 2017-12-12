'use strict'

const {expect} = require('chai')
const currencyFilter = require('./currency')

describe('When a pence value is passed through the Nunjucks currency filter', () => {
  it('it should convert it to the same amount in pounds and include the currency symbol', () => {
    expect(currencyFilter(999)).to.equal('£9.99')
  })
})
