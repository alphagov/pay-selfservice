const chai = require('chai')
const displayConverter = require('./display-converter')

const expect = chai.expect

describe('Display converter', function () {
  it('should add full_type to account if type is test', function () {
    const data = displayConverter({
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
    const data = displayConverter({
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

  it('should add full_type with value live to account if type is live', function () {
    const data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'stripe'
      }
    }, {}, {})

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'live',
      payment_provider: 'stripe',
      full_type: 'live'
    })
  })

  it('should add full_type with value test to account if type is test', function () {
    const data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'stripe'
      }
    }, {}, {})

    expect(data.currentGatewayAccount).to.deep.equal({
      type: 'test',
      payment_provider: 'stripe',
      full_type: 'Stripe test'
    })
  })

  it('should return isDigitalWalletSupported=true for Stripe account when when gateway type is live', () => {
    const data = displayConverter({
      account: {
        type: 'live',
        payment_provider: 'stripe'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(true)
  })

  it('should return isDigitalWalletSupported=true for Stripe account when gateway type is test', () => {
    const data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'stripe'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(true)
  })

  it('should return isDigitalWalletSupported=true for sandbox accounts', () => {
    const data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'sandbox'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(true)
  })

  it('should return isDigitalWalletSupported=false for unsupported provider', () => {
    const data = displayConverter({
      account: {
        type: 'test',
        payment_provider: 'epdq'
      }
    }, {}, {})
    expect(data.isDigitalWalletSupported).to.equal(false)
  })
})
