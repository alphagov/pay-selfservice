'use strict'

const Joi = require('joi')

const schema = Joi.object({
  url: Joi.string().optional(),
  entity_verification_document_id: Joi.string().optional()
})

class StripeAccount {
  constructor (body) {
    const params = Object.assign({}, body)

    const { error, value: model } = schema.validate(params, { allowUnknown: true, stripUnknown: true })

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
  const stripeAccount = {}

  if (params.url) {
    stripeAccount.business_profile = {
      url: params.url
    }
  }

  if (params.entity_verification_document_id) {
    stripeAccount.company = {
      verification: {
        document: {
          front: params.entity_verification_document_id
        }
      }
    }
  }

  return stripeAccount
}

module.exports = StripeAccount
