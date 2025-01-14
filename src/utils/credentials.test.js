const { expect } = require('chai')
const paths = require('../paths')
const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')
const { InvalidConfigurationError } = require('../errors')
const { getCurrentCredential, getSwitchingCredential, isSwitchingCredentialsRoute, getPSPPageLinks, getCredentialByExternalId, hasSwitchedProvider, getSwitchingCredentialIfExists, getActiveCredential, isEnableStripeOnboardingTaskListRoute, getWorldpayMerchantDetailOperationByKey, worldpayMerchantDetailOperations } = require('./credentials')

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

    it('validly returns the only credential when no active credentials exist', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [{ state: 'CREATED' }]
      })
      const credential = getCurrentCredential(account)
      expect(credential.state).is.equal('CREATED')
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

  describe('get the credential service is switching to if it exists', () => {
    it('returns null if no pending credentials available', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [{ state: 'ACTIVE' }]
      })
      const credential = getSwitchingCredentialIfExists(account)
      expect(credential).to.equal(null)
    })

    it('gets the pending credential being switched to', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', id: 100 },
          { state: 'ENTERED', id: 200 }
        ]
      })

      const credential = getSwitchingCredentialIfExists(account)
      expect(credential.gateway_account_credential_id).to.equal(200)
      expect(credential.state).to.equal('ENTERED')
    })
  })

  describe('credentials page utilities', () => {
    it('correctly identifies a switch psp route', () => {
      const req = { route: { path: paths.account.switchPSP.credentialsWithGatewayCheck } }
      expect(isSwitchingCredentialsRoute(req)).to.equal(true)
    })

    it('correctly identifies a non switch psp route', () => {
      const req = { route: { path: paths.account.yourPsp.worldpayCredentialsWithGatewayCheck } }
      expect(isSwitchingCredentialsRoute(req)).to.equal(false)
    })

    it('correctly identifies a your psp route when ENABLE_STRIPE_ONBOARDING_TASK_LIST true ', () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
      const req = { route: { path: paths.account.yourPsp.worldpayCredentialsWithGatewayCheck } }
      expect(isEnableStripeOnboardingTaskListRoute(req)).to.equal(true)
    })

    it('correctly identifies a your psp route  when ENABLE_STRIPE_ONBOARDING_TASK_LIST false ', () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'
      const req = { route: { path: paths.account.switchPSP.credentialsWithGatewayCheck } }
      expect(isEnableStripeOnboardingTaskListRoute(req)).to.equal(false)
    })

    it('correctly identifies a non your psp route', () => {
      const req = { route: { path: paths.account.switchPSP.credentialsWithGatewayCheck } }
      expect(isEnableStripeOnboardingTaskListRoute(req)).to.equal(false)
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

    it('correctly returns nothing if moving from a non-credential page supported PSP', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 100 },
          { state: 'CREATED', payment_provider: 'worldpay', id: 200 }
        ]
      })

      const linkCredentials = getPSPPageLinks(account)
      expect(linkCredentials).to.have.length(0)
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

    describe('get whether the gateway account has switched provider', () => {
      it('returns true if there are retired credentials', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { state: 'ACTIVE', id: 100 },
            { state: 'RETIRED', id: 200 }
          ]
        })
        const hasSwitched = hasSwitchedProvider(account)
        expect(hasSwitched).to.equal(true)
      })

      it('returns false if there are no retired credentials', () => {
        const account = gatewayAccountFixtures.validGatewayAccount({
          gateway_account_credentials: [
            { state: 'ACTIVE', id: 100 },
            { state: 'ENTERED', id: 200 }
          ]
        })

        const hasSwitched = hasSwitchedProvider(account)
        expect(hasSwitched).to.equal(false)
      })
    })
  })

  describe('getPSPPageLinks', () => {
    afterEach(() => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = undefined
    })

    it('should return credential for stripe account when ENABLE_STRIPE_ONBOARDING_TASK_LIST is enabled for gateway account', () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 20 }
        ]
      })
      expect(getPSPPageLinks(account)).to.have.length(1)
    })

    it('should not return credential for stripe account when ENABLE_STRIPE_ONBOARDING_TASK_LIST is not enabled on gateway account', () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 20 }
        ]
      })
      expect(getPSPPageLinks(account)).to.have.length(0)
    })

    it('should not return credential for stripe account when ENABLE_STRIPE_ONBOARDING_TASK_LIST is false', () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'false'
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 20 }
        ]
      })
      expect(getPSPPageLinks(account)).to.have.length(0)
    })

    it('should return credential for stripe account when ENABLE_STRIPE_ONBOARDING_TASK_LIST is true', () => {
      process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST = 'true'
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', payment_provider: 'stripe', id: 20 }
        ]
      })
      expect(getPSPPageLinks(account)).to.have.length(1)
    })
  })

  describe('getActiveCredential', () => {
    it('returns active credentials', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'ACTIVE', id: 100 },
          { state: 'RETIRED', id: 200 }
        ]
      })
      const credential = getActiveCredential(account)
      expect(credential.gateway_account_credential_id).to.equal(100)
    })

    it('returns null if there are no active credential', () => {
      const account = gatewayAccountFixtures.validGatewayAccount({
        gateway_account_credentials: [
          { state: 'CREATED', id: 100 },
          { state: 'ENTERED', id: 200 }
        ]
      })

      const credential = getActiveCredential(account)
      expect(credential).to.equal(null)
    })
  })

  describe('stores and index worldpay merchant detail operations', () => {
    it('gets a worldpay merchant detail operation by key, using the index', () => {
      expect(getWorldpayMerchantDetailOperationByKey('recurring-customer-initiated')).to.equal(worldpayMerchantDetailOperations.RECURRING_CUSTOMER_INITIATED)
    })
  })
})
