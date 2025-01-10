const { expect } = require('chai')

const accountsUrl = require('./gateway-account-urls')
describe('account URL checker', () => {
  it('correctly identifies an original account URL', () => {
    const url = '/billing-address'
    const result = accountsUrl.isLegacyAccountsUrl(url)
    expect(result).to.be.true //eslint-disable-line
  })

  it('correctly identifies URLs with trailing forward slash', () => {
    const url = '/billing-address/'
    const result = accountsUrl.isLegacyAccountsUrl(url)
    expect(result).to.be.true //eslint-disable-line
  })
})
