'use strict'

const Joi = require('joi')

const schema = {
  url: Joi.string().required()
}

class StripeAccount {
  constructor (body) {
    const params = Object.assign({}, body)

    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripeAccount ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  return {
    business_profile: {
      url: params.url
    }
  }
}

module.exports = StripeAccount
