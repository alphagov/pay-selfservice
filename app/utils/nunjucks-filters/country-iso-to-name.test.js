'use strict'

const {expect} = require('chai')
const countryISOtoName = require('./country-iso-to-name')

describe('When a country ISO code is passed through the Nunjucks filter', () => {
  it('it should convert it to the full name of that country', () => {
    expect(countryISOtoName('GB')).to.equal('United Kingdom')
  })
})
