const GatewayAccount = require('@models/GatewayAccount.class')
const { WORLDPAY } = require('@models/payment-providers')
const { expect } = require('chai')
const { InvalidConfigurationError } = require('@root/errors')

const gatewayAccountCredentials = [
  {
    external_id: '64adb8fcef44416a81d9571685a3f25c',
    payment_provider: 'stripe',
    state: 'ACTIVE',
    gateway_account_id: 12
  }
]

describe('GatewayAccount', () => {
  describe('getSwitchingCredentialIfPresent', () => {
    it('should return a credential if one exists', () => {
      const gatewayAccountData = {
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
      const switchingCredential = gatewayAccount.getSwitchingCredentialIfPresent()
      expect(switchingCredential.paymentProvider).to.equal(WORLDPAY)
    })

    it('should throw invalid configuration error if more than one pending credential is found', () => {
      const gatewayAccountData = {
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
      expect(() => gatewayAccount.getSwitchingCredentialIfPresent()).to.throw(InvalidConfigurationError, 'Unexpected number of credentials in a pending state for gateway account [found 2]')
    })

    it('should return null if no switching credential is found', () => {
      const gatewayAccountData = {
        gateway_account_credentials: gatewayAccountCredentials
      }
      const gatewayAccount = new GatewayAccount(gatewayAccountData)
      const switchingCredential = gatewayAccount.getSwitchingCredentialIfPresent()
      expect(switchingCredential).to.be.null //eslint-disable-line
    })
  })
})
