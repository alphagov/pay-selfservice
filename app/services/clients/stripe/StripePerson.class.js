/**
 * @typedef {Object} StripePersonParams
 * @property {string} first_name
 * @property {string} last_name
 * @property {number} dob_day
 * @property {number} dob_month
 * @property {number} dob_year
 * @property {string} email
 * @property {string} phone
 * @property {string} address_line1
 * @property {string} [address_line2]
 * @property {string} address_city
 * @property {string} address_postcode
 */

/**
 * @typedef {Object} StripePerson
 * @property {string} first_name
 * @property {string} last_name
 * @property {{
 *   day: number,
 *   month: number,
 *   year: number
 * }} dob
 * @property {string} phone
 * @property {string} email
 * @property {{
 *   line1: string,
 *   line2?: string,
 *   city: string,
 *   postal_code: string,
 *   country: string,
 * }} address
 * @property {{
 *   executive: boolean,
 *   representative: boolean
 * }} relationship
 */

const Joi = require('joi')

const schema = Joi.object({
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
})

/**
 * @class StripePerson
 */
class StripePerson {
  /**
   * @param {StripePersonParams} body
   * @returns {StripePerson}
   */
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = schema.validate(params, { allowUnknown: true, stripUnknown: true })

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
