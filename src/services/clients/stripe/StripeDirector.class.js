/**
 * @typedef {Object} StripeDirectorParams
 * @property {string} first_name
 * @property {string} last_name
 * @property {number} dob_day
 * @property {number} dob_month
 * @property {number} dob_year
 * @property {string} email
 */

/**
 * @typedef {Object} StripeDirector
 * @property {string} first_name
 * @property {string} last_name
 * @property {{
 *   day: number,
 *   month: number,
 *   year: number
 * }} dob
 * @property {string} email
 * @property {{
 *   director: boolean
 * }} relationship
 */

const Joi = require('joi')

const schema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  email: Joi.string().required(),
  dob_day: Joi.number().integer().strict().min(1).max(31),
  dob_month: Joi.number().integer().strict().min(1).max(12),
  dob_year: Joi.number().integer().strict().min(1900).max(2100),
  relationship: Joi.string().optional()
})

/**
 * @class StripeDirector
 */
class StripeDirector {
  /**
   * @param {StripeDirectorParams} body
   * @returns {StripeDirector}
   */
  constructor (body) {
    const params = Object.assign({}, body)

    const { error, value: model } = schema.validate(params, { allowUnknown: true, stripUnknown: true })

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
