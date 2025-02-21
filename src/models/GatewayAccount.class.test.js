const GatewayAccount = require('@models/GatewayAccount.class')
const { WORLDPAY, STRIPE, SANDBOX } = require('@models/constants/payment-providers')
const { expect } = require('chai')
const { InvalidConfigurationError } = require('@root/errors')
const { CREDENTIAL_STATE } = require('@utils/credentials')

const gatewayAccountCredentials = [
  {
    external_id: '64adb8fcef44416a81d9571685a3f25c',
    payment_provider: 'stripe',
    state: 'ACTIVE',
    gateway_account_id: 12
  }
]

describe('GatewayAccount', () => {
  describe('isSwitchingToProvider', () => {
    const testCases = [
      { pendingCredentialProvider: WORLDPAY, queriedProvider: WORLDPAY, expectedOutcome: true },
      { pendingCredentialProvider: STRIPE, queriedProvider: WORLDPAY, expectedOutcome: false },
      { pendingCredentialProvider: WORLDPAY, queriedProvider: SANDBOX, expectedOutcome: false },
      { pendingCredentialProvider: STRIPE, queriedProvider: STRIPE, expectedOutcome: true }
    ]
    testCases.forEach(({ pendingCredentialProvider, queriedProvider, expectedOutcome }) => {
      it(`should return ${expectedOutcome} for ${queriedProvider} when gateway account has pending ${pendingCredentialProvider} credential`, () => {
        const gatewayAccountData = {
          gateway_account_id: 12,
          provider_switch_enabled: true,
          gateway_account_credentials: [
            ...gatewayAccountCredentials,
            {
              external_id: '9bda702de8a44b99901236d1fdd438da',
              payment_provider: pendingCredentialProvider,
              state: 'CREATED',
              gateway_account_id: 12
            }
          ]
        }
        const gatewayAccount = new GatewayAccount(gatewayAccountData)
        expect(gatewayAccount.isSwitchingToProvider(queriedProvider)).to.equal(expectedOutcome)
      })
    })

    it('should return false when gateway account has no switching credential', () => {
      const gatewayAccountData = {
        gateway_account_id: 12,
        provider_switch_enabled: true,
        gateway_account_credentials: [
          ...gatewayAccountCredentials
        ]
      }
      const gatewayAccount = new GatewayAccount(gatewayAccountData)
      expect(gatewayAccount.isSwitchingToProvider(WORLDPAY)).to.equal(false)
    })

    it('should return false when gateway account is not provider switch enabled', () => {
      const gatewayAccountData = {
        gateway_account_id: 12,
        provider_switch_enabled: false,
        gateway_account_credentials: [
          ...gatewayAccountCredentials
        ]
      }
      const gatewayAccount = new GatewayAccount(gatewayAccountData)
      expect(gatewayAccount.isSwitchingToProvider(WORLDPAY)).to.equal(false)
    })
  })

  describe('getSwitchingCredential', () => {
    it('should return a credential if one exists', () => {
      const gatewayAccountData = {
        gateway_account_id: 12,
        provider_switch_enabled: true,
        gateway_account_credentials: [
          ...gatewayAccountCredentials,
          {
            external_id: '9bda702de8a44b99901236d1fdd438da',
            payment_provider: 'worldpay',
            state: 'CREATED',
            gateway_account_id: 12
          }
        ]
      }
      const gatewayAccount = new GatewayAccount(gatewayAccountData)
      const switchingCredential = gatewayAccount.getSwitchingCredential()
      expect(switchingCredential.paymentProvider).to.equal(WORLDPAY)
    })

    it('should throw invalid configuration error if more than one pending credential is found', () => {
      const gatewayAccountData = {
        gateway_account_id: 12,
        provider_switch_enabled: true,
        gateway_account_credentials: [
          ...gatewayAccountCredentials,
          ...Array(2).fill({
            external_id: '9bda702de8a44b99901236d1fdd438da',
            payment_provider: 'worldpay',
            state: 'CREATED',
            gateway_account_id: 12
          })
        ]
      }
      const gatewayAccount = new GatewayAccount(gatewayAccountData)
      expect(() => gatewayAccount.getSwitchingCredential())
        .to.throw(InvalidConfigurationError, 'Unexpected number of credentials in a pending state for gateway account [found: 2, gateway_account_id: 12]')
    })

    it('should throw invalid configuration error if no switching credential is found', () => {
      const gatewayAccountData = {
        gateway_account_id: 12,
        provider_switch_enabled: true,
        gateway_account_credentials: gatewayAccountCredentials
      }
      const gatewayAccount = new GatewayAccount(gatewayAccountData)
      expect(() => gatewayAccount.getSwitchingCredential())
        .to.throw(InvalidConfigurationError)
    })

    it('should throw invalid configuration error if no active credential found for gateway account', () => {
      const gatewayAccount = new GatewayAccount({
        gateway_account_id: 12,
        provider_switch_enabled: true,
        gateway_account_credentials: [
          {
            external_id: '64adb8fcef44416a81d9571685a3f25c',
            payment_provider: 'stripe',
            state: CREDENTIAL_STATE.RETIRED,
            gateway_account_id: 12
          }
        ]
      })
      expect(() => gatewayAccount.getSwitchingCredential())
        .to.throw(InvalidConfigurationError)
    })

    it('should throw invalid configuration error if provider switching is not enabled', () => {
      const gatewayAccount = new GatewayAccount({
        gateway_account_id: 12,
        provider_switch_enabled: false,
        gateway_account_credentials: gatewayAccountCredentials
      })
      expect(() => gatewayAccount.getSwitchingCredential())
        .to.throw(InvalidConfigurationError)
    })
  })
})
