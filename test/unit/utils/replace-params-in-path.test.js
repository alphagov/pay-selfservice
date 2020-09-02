'use strict'

const { expect } = require('chai')

const formattedPathFor = require('../../../app/utils/replace-params-in-path')

describe('When a path is formatted', () => {
  it('should replace each placeholder with the appropriate value by index', () => {
    let formattedPath = formattedPathFor('/foo/:placeholder1/bar/:placeholder2', 'value1', 'value2')
    expect(formattedPath).to.equal('/foo/value1/bar/value2')
  })
  it('should URL-encode the replaced value', () => {
    let formattedPath = formattedPathFor('/foo/:placeholder', 'abc?dëf=ghi j/k😀')
    expect(formattedPath).to.equal('/foo/abc%3Fd%C3%ABf%3Dghi%20j%2Fk%F0%9F%98%80')
  })
  it('should not replace a placeholder if no replacement is supplied', () => {
    let formattedPath = formattedPathFor('/foo/:placeholder1/bar/:placeholder2', 'value1')
    expect(formattedPath).to.equal('/foo/value1/bar/:placeholder2')
  })
})
