var chai = require('chai')
var displayConverter = require('./display-converter')

const expect = chai.expect

describe('Display converter', function () {
  afterEach(() => {
    process.env.ALLOW_ENABLING_DIGITAL_WALLETS_FOR_STRIPE_ACCOUNT = undefined
  })

  it('should add full_type to account if type is test', function () {
    let data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'sandbox'
      }
    }, {}, null)

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'test',
      payment_provider: 'sandbox',
      full_type: 'Sandbox test'
    })
  })

  it('should add full_type with value live to account if type is live', function () {
    let data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'worldpay'
      }
    }, {}, {})

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'live',
      payment_provider: 'worldpay',
      full_type: 'live'
    })
  })

  it('should return isDigitalWalletSupported=false for Stripe account when ALLOW_ENABLING_DIGITAL_WALLETS_FOR_STRIPE_ACCOUNT is not set', () => {
    const data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'stripe'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(false)
  })

  it('should return isDigitalWalletSupported=false for Stripe account when ALLOW_ENABLING_DIGITAL_WALLETS_FOR_STRIPE_ACCOUNT is false', () => {
    process.env.ALLOW_ENABLING_DIGITAL_WALLETS_FOR_STRIPE_ACCOUNT = 'false'
    const data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'stripe'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(false)
  })

  it('should return isDigitalWalletSupported=true for Stripe account when ALLOW_ENABLING_DIGITAL_WALLETS_FOR_STRIPE_ACCOUNT is true', () => {
    process.env.ALLOW_ENABLING_DIGITAL_WALLETS_FOR_STRIPE_ACCOUNT = 'true'
    const data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'stripe'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(true)
  })
})
