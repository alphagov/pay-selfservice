'use strict'

const { expect } = require('chai')

const StripePerson = require('./StripePerson.class')

const firstName = 'Carol'
const lastName = 'Danvers'
const addressLine1 = '10 Downing Street'
const addressLine2 = 'Marvel Cinematic Universe'
const addressCity = 'London'
const addressPostcode = 'SW1A 2AA'
const dobDay = 8
const dobMonth = 3
const dobYear = 2019
const phone = '01134960000'
const email = 'foo@example.com'

describe('StripePerson', () => {
  it('should successfully create a StripePerson object with a second address line', () => {
    const stripePerson = new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_line2: addressLine2,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear
    })

    expect(stripePerson.basicObject()).to.deep.equal({
      first_name: firstName,
      last_name: lastName,
      address: {
        line1: addressLine1,
        line2: addressLine2,
        city: addressCity,
        postal_code: addressPostcode,
        country: 'GB'
      },
      dob: {
        day: dobDay,
        month: dobMonth,
        year: dobYear
      },
      relationship: {
        executive: true,
        representative: true
      }
    })
  })

  it('should successfully create a StripePerson object without a second address line', () => {
    const stripePerson = new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear
    })

    expect(stripePerson.basicObject()).to.deep.equal({
      first_name: firstName,
      last_name: lastName,
      address: {
        line1: addressLine1,
        city: addressCity,
        postal_code: addressPostcode,
        country: 'GB'
      },
      dob: {
        day: dobDay,
        month: dobMonth,
        year: dobYear
      },
      relationship: {
        executive: true,
        representative: true
      }
    })
  })

  it('should successfully create a StripePerson object with phone and email', () => {
    const stripePerson = new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_line2: addressLine2,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear,
      phone,
      email
    })

    expect(stripePerson.basicObject()).to.deep.equal({
      first_name: firstName,
      last_name: lastName,
      address: {
        line1: addressLine1,
        line2: addressLine2,
        city: addressCity,
        postal_code: addressPostcode,
        country: 'GB'
      },
      dob: {
        day: dobDay,
        month: dobMonth,
        year: dobYear
      },
      relationship: {
        executive: true,
        representative: true
      },
      phone,
      email
    })
  })

  it('should fail when property that should be string is not string', () => {
    expect(() => new StripePerson({
      first_name: 12345,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "first_name" must be a string')
  })

  it('should fail when property that should be string is empty', () => {
    expect(() => new StripePerson({
      first_name: '',
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "first_name" is not allowed to be empty')
  })

  it('should fail when property that should be string is null', () => {
    expect(() => new StripePerson({
      first_name: null,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "first_name" must be a string')
  })

  it('should fail when property that should be integer is a string that coerces to an integer', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: '8',
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_day" must be a number')
  })

  it('should fail when property that should be integer is number but not integer', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: 8.1,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_day" must be an integer')
  })

  it('should fail when property that should be integer is null', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: null,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_day" must be a number')
  })

  it('should fail when day is less than 1', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: 0,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_day" must be larger than or equal to 1')
  })

  it('should fail when day is more than 31', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: 32,
      dob_month: dobMonth,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_day" must be less than or equal to 31')
  })

  it('should fail when month is less than 1', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: 0,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_month" must be larger than or equal to 1')
  })

  it('should fail when month is larger than 12', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: 13,
      dob_year: dobYear
    })).to.throw('StripePerson "dob_month" must be less than or equal to 12')
  })

  it('should fail when year is less than 1000', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: 999
    })).to.throw('StripePerson "dob_year" must be larger than or equal to 1000')
  })

  it('should fail when year is more than 9999', () => {
    expect(() => new StripePerson({
      first_name: firstName,
      last_name: lastName,
      address_line1: addressLine1,
      address_city: addressCity,
      address_postcode: addressPostcode,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: 10000
    })).to.throw('StripePerson "dob_year" must be less than or equal to 9999')
  })
})
