'use strict'

const Joi = require('joi')

const schema = {
  'merchant-name': Joi.string().required(),
  'address-line1': Joi.string().required(),
  'address-line2': Joi.string().optional(),
  'address-city': Joi.string().required(),
  'address-postcode': Joi.string().required(),
  'address-country': Joi.string().required(),
  'telephone-number': Joi.string().required(),
  url: Joi.string().required()
}

class StripeOrganisationDetails {
  constructor(body) {
    const params = Object.assign({}, body)

    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new Error(`StripeOrganisationDetails ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject() {
    return Object.assign({}, this)
  }
}

function build(params) {
  const stripeOrganisationDetails = {
    company: {
      name: params['merchant-name'],
      address: {
        line1: params['address-line1'],
        city: params['address-city'],
        postal_code: params['address-postcode'],
        country: params['address-country']
      },
      phone: params['telephone-number']
    },
    business_profile: {
      url: params.url
    }
  }

  if (params['address-line2']) {
    stripeOrganisationDetails.company.address.line2 = params['address-line2']
  }

  return stripeOrganisationDetails
}

module.exports = StripeOrganisationDetails
