'use strict'

const Joi = require('joi')

const schema = {
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  address_line1: Joi.string().required(),
  address_line2: Joi.string().optional(),
  address_city: Joi.string().required(),
  address_postcode: Joi.string().required(),
  dob_day: Joi.number().integer().strict().min(1).max(31),
  dob_month: Joi.number().integer().strict().min(1).max(12),
  dob_year: Joi.number().integer().strict().min(1000).max(9999),
  phone: Joi.string().optional(),
  email: Joi.string().optional()
}

class StripePerson {
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripePerson ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  const person = {
    first_name: params.first_name,
    last_name: params.last_name,
    address: {
      line1: params.address_line1,
      city: params.address_city,
      postal_code: params.address_postcode,
      country: 'GB'
    },
    dob: {
      day: params.dob_day,
      month: params.dob_month,
      year: params.dob_year
    },
    relationship: {
      executive: true,
      representative: true
    }
  }

  if (params.address_line2) {
    person.address.line2 = params.address_line2
  }
  if (params.phone) {
    person.phone = params.phone
  }
  if (params.email) {
    person.email = params.email
  }

  return person
}

module.exports = StripePerson
