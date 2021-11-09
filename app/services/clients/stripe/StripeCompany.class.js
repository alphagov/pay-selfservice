'use strict'

const Joi = require('joi')

const schema = {
  vat_id: Joi.string().optional(),
  tax_id: Joi.string().optional(),
  directors_provided: Joi.boolean().optional()
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
    company: {}
  }

  if (params.vat_id) {
    stripeCompany.company.vat_id = params.vat_id
  }

  if (params.tax_id) {
    stripeCompany.company.tax_id = params.tax_id
  }

  if (params.directors_provided) {
    stripeCompany.company.directors_provided = params.directors_provided
  }

  return stripeCompany
}

module.exports = StripeCompany
