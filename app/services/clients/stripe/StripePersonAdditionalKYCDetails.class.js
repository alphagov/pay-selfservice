'use strict'

const Joi = require('joi')

const schema = {
  phone: Joi.string().required(),
  email: Joi.string().required()
}

class StripePersonAdditionalKYCDetails {
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripePersonAdditionalKYCDetails ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  return {
    phone: params.phone,
    email: params.email
  }
}

module.exports = StripePersonAdditionalKYCDetails
