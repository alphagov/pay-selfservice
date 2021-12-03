'use strict'

const { expect } = require('chai')

const StripePersonAdditionalKYCDetails = require('./StripePersonAdditionalKYCDetails.class')

const phone = '01134960000'
const email = 'foo@example.com'

describe('StripePerson', () => {
  it('should successfully create a StripePersonAdditionalKYCDetails object', () => {
    const stripePerson = new StripePersonAdditionalKYCDetails({
      phone: phone,
      email: email
    })

    expect(stripePerson.basicObject()).to.deep.equal({
      phone: phone,
      email: email,
      relationship: {
        executive: true,
        representative: true
      }
    })
  })
})
