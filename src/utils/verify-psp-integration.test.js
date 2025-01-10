const { expect } = require('chai')
const connectorChargeFixtures = require('../../test/fixtures/connector-charge.fixtures')
const { filterNextUrl } = require('./verify-psp-integration')

describe('verify psp integration utility', () => {
  it('gets the next url for a valid charge', () => {
    const charge = connectorChargeFixtures.validChargeResponse({
      next_url: 'some/next/url'
    })
    expect(filterNextUrl(charge)).to.equal('some/next/url')
  })

  it('safely returns nothing if next url missing', () => {
    expect(filterNextUrl({})).to.equal(undefined)
  })
})
