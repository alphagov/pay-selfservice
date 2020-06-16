'use strict'

const Joi = require('joi')

const schema = {
  vat_id: Joi.string().required(),
  tax_id: Joi.string().optional()
}

class StripeCompany {
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = Joi.validate(params, schema)

    if (error) {
      throw new Error(`StripeCompany ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  const stripeCompany = {
    company: {
      vat_id: params.vat_id
    }
  }

  if (params.tax_id) {
    stripeCompany.company.tax_id = params.tax_id
  }

  return stripeCompany
}

module.exports = StripeCompany
