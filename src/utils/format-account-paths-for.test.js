const { expect } = require('chai')

const formatAccountPathsFor = require('./format-account-paths-for')

describe('formatting account paths utility', () => {
  it('outputs a full account path given relative path and id', () => {
    const path = formatAccountPathsFor('/billing-address', 'a-valid-external-id')
    expect(path).to.equal('/account/a-valid-external-id/billing-address')
  })
})
