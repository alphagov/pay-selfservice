'use strict'

const {expect} = require('chai')
const slugify = require('./remove-definate-articles')

describe('When a string is passed through the Nunjucks removeDefinateArticles filter', () => {
  it('it should remove indefinate articles (a/an)', () => {
    expect(slugify('Pay for an article')).to.equal('Pay for article')
  })
  it('it should remove definate articles (the)', () => {
    expect(slugify('The Private Office of Jon Heslop')).to.equal('Private Office of Jon Heslop')
  })
})
