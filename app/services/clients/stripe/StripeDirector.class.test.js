'use strict'

const { expect } = require('chai')

const StripePerson = require('./StripeDirector.class')

const firstName = 'Jane'
const lastName = 'Doe'
const dobDay = 1
const dobMonth = 1
const dobYear = 1990
const email = 'test@example.org'

describe('StripeDirector', () => {
  it('should successfully create a stripe director for valid payload', () => {
    const stripePerson = new StripePerson({
      first_name: firstName,
      last_name: lastName,
      dob_day: dobDay,
      dob_month: dobMonth,
      dob_year: dobYear,
      email
    })

    expect(stripePerson.basicObject()).to.deep.equal({
      first_name: firstName,
      last_name: lastName,
      dob: {
        day: dobDay,
        month: dobMonth,
        year: dobYear
      },
      email,
      relationship: {
        director: true
      }
    })
  })

  describe('First name validation', () => {
    [12345, '', null].forEach(async function (value) {
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripePerson({
          first_name: value,
          last_name: lastName,
          email,
          dob_day: dobDay,
          dob_month: dobMonth,
          dob_year: dobYear
        })).to.throw(/StripeDirector "first_name" (must be a string|is not allowed to be empty)/)
      })
    })
  })

  describe('Last name validation', () => {
    [12345, '', null].forEach(async function (value) {
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripePerson({
          first_name: firstName,
          last_name: value,
          email,
          dob_day: dobDay,
          dob_month: dobMonth,
          dob_year: dobYear
        })).to.throw(/StripeDirector "last_name" (must be a string|is not allowed to be empty)/)
      })
    })
  })

  describe('Email validation', () => {
    [12345, '', null].forEach(async function (value) {
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripePerson({
          first_name: firstName,
          last_name: lastName,
          email: value,
          dob_day: dobDay,
          dob_month: dobMonth,
          dob_year: dobYear
        })).to.throw(/StripeDirector "email" (must be a string|is not allowed to be empty)/)
      })
    })
  })

  describe('Date of birth - Day validation', () => {
    ['8', 8.1, null].forEach(async function (value) {
      it('Should throw error for invalid value \'' + value + '\'', async () => {
        expect(() => new StripePerson({
          first_name: firstName,
          last_name: lastName,
          email,
          dob_day: value,
          dob_month: dobMonth,
          dob_year: dobYear
        })).to.throw(/StripeDirector "dob_day" must be (a number|an integer)/)
      })
    })

    it('Should throw error when day is less than 1', () => {
      expect(() => new StripePerson({
        first_name: firstName,
        last_name: lastName,
        email,
        dob_day: 0,
        dob_month: dobMonth,
        dob_year: dobYear
      })).to.throw('StripeDirector "dob_day" must be larger than or equal to 1')
    })

    it('Should throw error when day is more than 31', () => {
      expect(() => new StripePerson({
        first_name: firstName,
        last_name: lastName,
        email,
        dob_day: 32,
        dob_month: dobMonth,
        dob_year: dobYear
      })).to.throw('StripeDirector "dob_day" must be less than or equal to 31')
    })
  })

  describe('Date of birth - Month validation', () => {
    it('Should throw error when month is less than 1', () => {
      expect(() => new StripePerson({
        first_name: firstName,
        last_name: lastName,
        email,
        dob_day: dobDay,
        dob_month: 0,
        dob_year: dobYear
      })).to.throw('StripeDirector "dob_month" must be larger than or equal to 1')
    })

    it('Should throw error when month is larger than 12', () => {
      expect(() => new StripePerson({
        first_name: firstName,
        last_name: lastName,
        email,
        dob_day: dobDay,
        dob_month: 13,
        dob_year: dobYear
      })).to.throw('StripeDirector "dob_month" must be less than or equal to 12')
    })
  })
  describe('Date of birth - Year validation', () => {
    it('Should throw error when year is less than 1000', () => {
      expect(() => new StripePerson({
        first_name: firstName,
        last_name: lastName,
        email,
        dob_day: dobDay,
        dob_month: dobMonth,
        dob_year: 999
      })).to.throw('StripeDirector "dob_year" must be larger than or equal to 1900')
    })

    it('Should throw error when year is more than 9999', () => {
      expect(() => new StripePerson({
        first_name: firstName,
        last_name: lastName,
        email,
        dob_day: dobDay,
        dob_month: dobMonth,
        dob_year: 10000
      })).to.throw('StripeDirector "dob_year" must be less than or equal to 2100')
    })
  })
})
