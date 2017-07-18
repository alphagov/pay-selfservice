'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Custom dependencies
const pactBase = require(path.join(__dirname, '/pact_base'))

// Global setup
const pactRegister = pactBase()

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
        return pactRegister.pactify(data)
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
        return pactRegister.pactify(data)
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
        return pactRegister.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  invalidServiceNameRequest: (opts = {}) => {
    const data = {
      service_name: opts.service_name || ' '
    }

    return {
      getPactified: () => {
        return pactRegister.pactify(data)
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

    return pactRegister.withPactified(response)
  }

}
