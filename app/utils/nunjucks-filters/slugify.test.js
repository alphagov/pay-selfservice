'use strict'

const {expect} = require('chai')
const slugify = require('./slugify')

describe('When a string is passed through the Nunjucks slugify filter', () => {
  it('it should make it url friendly', () => {
    expect(slugify('Someones’s string')).to.equal('someoness-string')
  })
})
