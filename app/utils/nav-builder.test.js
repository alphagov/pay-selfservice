const { expect } = require('chai')
const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')
const { yourPSPNavigationItems } = require('./nav-builder')

describe('navigation builder', () => {
  describe('build links to psp pages', () => {
    it('sets the default ID for a single credential regardless of state', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { payment_provider: 'smartpay', state: 'CREATED', external_id: 'a-valid-credential-id-smartpay' }
        ]
      })
      expect(yourPSPNavigationItems(account)[0].id).to.equal('navigation-menu-your-psp')
    })

    it('correctly labels ids and names and returns valid schema', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { payment_provider: 'smartpay', state: 'ACTIVE', external_id: 'a-valid-credential-id-smartpay' },
          { payment_provider: 'worldpay', state: 'RETIRED', external_id: 'another-valid-credential-id-worldpay' }
        ]
      })

      const links = yourPSPNavigationItems(account, '/your-psp/a-valid-credential-id-smartpay')
      expect(links).to.have.length(2)
      expect(links[0].id).to.equal('navigation-menu-your-psp')
      expect(links[0].name).to.equal('Your PSP - Smartpay')
      expect(links[0].current).to.equal(true)
      expect(links[1].id).to.equal('navigation-menu-your-psp-another-valid-credential-id-worldpay')
      expect(links[1].name).to.equal('Old PSP - Worldpay')
      expect(links[1].current).to.equal(false)
    })
  })
})
