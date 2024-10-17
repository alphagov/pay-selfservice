'use strict'

const { expect } = require('chai')

const StripeAccount = require('./StripeAccount.class')

const url = 'https://www.example.com'

describe('StripeAccount', () => {
  it('should successfully create a stripe account for valid url', () => {
    const stripeAccount = new StripeAccount({
      url
    })

    expect(stripeAccount.basicObject()).to.deep.equal({
      business_profile: {
        url
      }
    })
  })

  it('should return correct payload for Stripe account for entity verification document', () => {
    const stripeAccount = new StripeAccount({
      entity_verification_document_id: 'file_123'
    })

    expect(stripeAccount.basicObject()).to.deep.equal({
      company: {
        verification: {
          document: {
            front: 'file_123'
          }
        }
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

  describe('Entity verification document ID validation', () => {
    [12345, '', null].forEach(async function (value) {
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripeAccount({
          entity_verification_document_id: value
        })).to.throw(/StripeAccount "entity_verification_document_id" (must be a string|is not allowed to be empty)/)
      })
    })
  })
})
