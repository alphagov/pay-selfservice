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

  it('correctly upgrades a URL to the account structure', () => {
    const url = '/create-payment-link/manage/some-product-external-id/add-reporting-column/some-metadata-key'
    const gatewayAccountExternalId = 'some-account-external-id'
    expect(accountsUrl.getUpgradedAccountStructureUrl(url, gatewayAccountExternalId)).to.equal('/account/some-account-external-id/create-payment-link/manage/some-product-external-id/add-reporting-column/some-metadata-key')
  })
})
