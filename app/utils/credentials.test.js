const { expect } = require('chai')
const paths = require('../paths')
const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')
const { InvalidConfigurationError } = require('../errors')
const { getCurrentCredential, getSwitchingCredential, isSwitchingCredentialsRoute, getPSPPageLinks, getCredentialByExternalId } = require('./credentials')

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
      const req = { route: { path: paths.account.switchPSP.credentialsWithGatewayCheck } }
      expect(isSwitchingCredentialsRoute(req)).to.equal(true)
    })

    it('correctly identifies a non switch psp route', () => {
      const req = { route: { path: paths.account.yourPsp.credentialsWithGatewayCheck } }
      expect(isSwitchingCredentialsRoute(req)).to.equal(false)
    })

    it('correctly filters out valid credentials for non-supported providers', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'RETIRED', payment_provider: 'sandbox', id: 100 },
          { state: 'ACTIVE', payment_provider: 'stripe', id: 20 }
        ]
      })
      expect(getPSPPageLinks(account)).to.have.length(0)
    })

    it('correctly returns the account starting credential', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', payment_provider: 'worldpay', id: 100 }
        ]
      })

      const linkCredentials = getPSPPageLinks(account)
      expect(linkCredentials).to.have.length(1)
      expect(linkCredentials[0].gateway_account_credential_id).to.equal(100)
    })

    it('correctly returns only terminal credentials for supported providers', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', payment_provider: 'worldpay', id: 300 },
          { state: 'ACTIVE', payment_provider: 'smartpay', id: 200 },
          { state: 'RETIRED', payment_provider: 'epdq', id: 100 }
        ]
      })

      const linkCredentials = getPSPPageLinks(account)
      expect(linkCredentials).to.have.length(2)
      expect(linkCredentials[0].gateway_account_credential_id).to.equal(200)
      expect(linkCredentials[1].gateway_account_credential_id).to.equal(100)
    })

    it('finds credential by external id', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', payment_provider: 'worldpay', id: 300, external_id: 'first-external-id' },
          { state: 'ACTIVE', payment_provider: 'smartpay', id: 200, external_id: 'second-external-id' },
          { state: 'RETIRED', payment_provider: 'epdq', id: 100, external_id: 'third-external-id' }
        ]
      })
      expect(getCredentialByExternalId(account, 'second-external-id').gateway_account_credential_id).to.equal(200)
    })
  })
})
