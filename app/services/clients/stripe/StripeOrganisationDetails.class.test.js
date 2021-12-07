'use strict'

const { expect } = require('chai')

const StripeOrganisationDetails = require('./StripeOrganisationDetails.class')

const validName = 'HMRC'
const validLine1 = 'A building'
const validLine2 = 'A street'
const validCity = 'A city'
const validCountry = 'GB'
const validPostcode = 'E1 8QS'
const validTelephoneNumber = '01134960000'
const validUrl = 'https://www.example.com'

describe('StripeOrganisationDetails', () => {
  it('should successfully create a StripeOrganisationDetails object', () => {
    const stripeOrganisationDetails = new StripeOrganisationDetails({
      name: validName,
      address_line1: validLine1,
      address_line2: validLine2,
      address_city: validCity,
      address_postcode: validPostcode,
      address_country: validCountry,
      telephone_number: validTelephoneNumber,
      url: validUrl
    })

    expect(stripeOrganisationDetails.basicObject()).to.deep.equal({
      company: {
        name: validName,
        address: {
          line1: validLine1,
          line2: validLine2,
          city: validCity,
          postal_code: validPostcode,
          country: validCountry
        },
        phone: validTelephoneNumber
      },
      business_profile: {
        url: validUrl
      }
    })
  })

  it('should successfully create a StripeOrganisationDetails object without an address line 2', () => {
    const stripeOrganisationDetails = new StripeOrganisationDetails({
      name: validName,
      address_line1: validLine1,
      address_city: validCity,
      address_postcode: validPostcode,
      address_country: validCountry,
      telephone_number: validTelephoneNumber,
      url: validUrl
    })

    expect(stripeOrganisationDetails.basicObject()).to.deep.equal({
      company: {
        name: validName,
        address: {
          line1: validLine1,
          city: validCity,
          postal_code: validPostcode,
          country: validCountry
        },
        phone: validTelephoneNumber
      },
      business_profile: {
        url: validUrl
      }
    })
  })
})