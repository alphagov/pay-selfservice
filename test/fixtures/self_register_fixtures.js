'use strict'

const _ = require('lodash')
const { pactify, withPactified } = require('./pact_base')

function validPassword () {
  return 'G0VUkPay2017Rocks'
}

module.exports = {

  validRegisterRequest: (opts = {}) => {
    const register = 'random@example.com'

    const data = {
      email: opts.email || register,
      telephone_number: opts.telephone_number || '07912345678',
      password: opts.password || validPassword()
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  invalidEmailRegisterRequest: (opts = {}) => {
    const data = {
      email: opts.email || '',
      telephone_number: opts.telephone_number || '07912345678',
      password: opts.password || 'ndjcnwjk8789e3'
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validServiceNameRequest: (opts = {}) => {
    const data = {
      service_name: opts.service_name || 'My Service name'
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  invalidServiceNameRequest: (opts = {}) => {
    const data = {
      service_name: opts.service_name || ''
    }

    return {
      getPactified: () => {
        return pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  badRequestResponseWhenFieldsMissing: (missingFields) => {
    const responseData = _.map(missingFields, (field) => {
      return `Field [${field}] is required`
    })
    const response = {
      errors: responseData
    }

    return withPactified(response)
  }

}
