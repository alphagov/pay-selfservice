'use strict'

const Joi = require('joi')

const schema = {
  name: Joi.string().required(),
  address_line1: Joi.string().required(),
  address_line2: Joi.string().optional(),
  address_city: Joi.string().required(),
  address_postcode: Joi.string().required(),
  address_country: Joi.string().required(),
  telephone_number: Joi.string().required(),
  url: Joi.string().required()
}

class StripeOrganisationDetails {
  constructor (body) {
    const params = Object.assign({}, body)

    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripeOrganisationDetails ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

function build (params) {
  const stripeOrganisationDetails = {
    company: {
      name: params.name,
      address: {
        line1: params.address_line1,
        city: params.address_city,
        postal_code: params.address_postcode,
        country: params.address_country
      },
      phone: params.telephone_number
    },
    business_profile: {
      url: params.url
    }
  }

  if (params.address_line2) {
    stripeOrganisationDetails.company.address.line2 = params.address_line2
  }

  return stripeOrganisationDetails
}

module.exports = StripeOrganisationDetails
