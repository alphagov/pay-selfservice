'use strict'

const _ = require('lodash')

module.exports = {

  validRegisterRequest: (opts = {}) => {
    return {
      email: opts.email || 'random@example.com',
      telephone_number: opts.telephone_number || '07912345678',
      password: opts.password || 'G0VUkPay2017Rocks'
    }
  },

  invalidEmailRegisterRequest: (opts = {}) => {
    return {
      email: opts.email || '',
      telephone_number: opts.telephone_number || '07912345678',
      password: opts.password || 'ndjcnwjk8789e3'
    }
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    return {
      errors: responseData
    }
  }

}
