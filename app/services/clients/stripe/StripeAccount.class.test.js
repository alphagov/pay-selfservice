'use strict'

const { expect } = require('chai')

const StripeAccount = require('./StripeAccount.class')

const url = 'https://www.example.com'

describe('StripeAccount', () => {
  it('should successfully create a stripe account for valid payload', () => {
    const stripeAccount = new StripeAccount({
      url: url
    })

    expect(stripeAccount.basicObject()).to.deep.equal({
      business_profile: {
        url: url
      }
    })
  })

  describe('URL validation', () => {
    [12345, '', null].forEach(async function (value) {
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripeAccount({
          url: value
        })).to.throw(/StripeAccount "url" (must be a string|is not allowed to be empty)/)
      })
    })
  })
})
