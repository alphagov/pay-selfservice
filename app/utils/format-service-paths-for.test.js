const { expect } = require('chai')

const formatServicePathsFor = require('./format-service-paths-for')

describe('formatting service paths utility', () => {
  it('outputs a full service path given relative path and id', () => {
    const path = formatServicePathsFor('/billing-address', 'a-valid-external-id')
    expect(path).to.equal('/service/a-valid-external-id/billing-address')
  })
})
