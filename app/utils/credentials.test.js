const { expect } = require('chai')
const paths = require('../paths')
const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')
const { InvalidConfigurationError } = require('../errors')
const { getCurrentCredential, getSwitchingCredential, isSwitchingCredentialsRoute } = require('./credentials')

describe('credentials utility', () => {
  describe('get services current credential', () => {
    it('validly returns nothing when no credentials provided', () => {
      expect(getCurrentCredential({})).to.equal(null)
    })

    it('returns active credential from list of multiple credentials', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', id: 100 },
          { state: 'ACTIVE', id: 200 },
          { state: 'ENTERED', id: 300 }
        ]
      })

      const credential = getCurrentCredential(account)
      expect(credential.gateway_account_credential_id).is.equal(200)
      expect(credential.state).is.equal('ACTIVE')
    })

    it('validly returns nothing when no active credentials exist', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [{ state: 'CREATED' }]
      })
      expect(getCurrentCredential(account)).to.equal(null)
    })
  })

  describe('get the credential service is switching to', () => {
    it('throws an exception for upstream services/controllers if no pending credentials available', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [{ state: 'ACTIVE' }]
      })
      const checkSwitchingCreds = () => getSwitchingCredential(account)
      expect(checkSwitchingCreds).to.throw(InvalidConfigurationError)
    })

    it('gets the pending credential being switched to', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', id: 100 },
          { state: 'ENTERED', id: 200 }
        ]
      })

      const credential = getSwitchingCredential(account)
      expect(credential.gateway_account_credential_id).to.equal(200)
      expect(credential.state).to.equal('ENTERED')
    })

    it('throws an expected error if account has an ambiguous configuration', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', id: 100 },
          { state: 'ENTERED', id: 200 },
          { state: 'ACTIVE', id: 300 }
        ]
      })

      const checkSwitchingCreds = () => getSwitchingCredential(account)
      expect(checkSwitchingCreds).to.throw(InvalidConfigurationError)
    })
  })

  describe('credentials page utilities', () => {
    it('correctly identifies a switch psp route', () => {
      const req = { route: { path: paths.account.switchPSP.worldpayCredentials } }
      expect(isSwitchingCredentialsRoute(req)).to.equal(true)
    })
    it('correctly identifies a non switch psp route', () => {
      const req = { route: { path: paths.account.yourPsp.worldpayCredentials } }
      expect(isSwitchingCredentialsRoute(req)).to.equal(false)
    })
  })
})
