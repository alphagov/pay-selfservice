'use strict'

const Joi = require('joi')

const schema = Joi.object({
  bank_account_sort_code: Joi.string().required(),
  bank_account_number: Joi.string().required()
})

class StripeBankAccount {
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = schema.validate(params, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripeBankAccount ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  return {
    external_account: {
      object: 'bank_account',
      country: 'GB',
      currency: 'GBP',
      account_holder_type: 'company',
      routing_number: params.bank_account_sort_code,
      account_number: params.bank_account_number
    }
  }
}

module.exports = StripeBankAccount
