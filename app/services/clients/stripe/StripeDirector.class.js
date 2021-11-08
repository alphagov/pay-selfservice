'use strict'

const Joi = require('joi')

const schema = {
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().required(),
  dob_day: Joi.number().integer().strict().min(1).max(31),
  dob_month: Joi.number().integer().strict().min(1).max(12),
  dob_year: Joi.number().integer().strict().min(1900).max(2100),
  relationship: Joi.string().optional()
}

class StripeDirector {
  constructor (body) {
    const params = Object.assign({}, body)

    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripeDirector ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  return {
    first_name: params.first_name,
    last_name: params.last_name,
    dob: {
      day: params.dob_day,
      month: params.dob_month,
      year: params.dob_year
    },
    email: params.email,
    relationship: {
      director: true
    }
  }
}

module.exports = StripeDirector
