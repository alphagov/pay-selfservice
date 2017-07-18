'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Custom dependencies
const userFixtures = require(path.join(__dirname, '/user_fixtures'))
const pactBase = require(path.join(__dirname, '/pact_base'))

// Global setup
const pactServices = pactBase({array: ['service_ids']})

module.exports = {

  /**
   * @param users Array params override get users response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validServiceUsersResponse: (users) => {
    let data = []
    for (let user of users) {
      data.push(userFixtures.validUserResponse(user).getPlain())
    }
    return {
      getPactified: () => {
        return pactServices.pactifyNestedArray(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  getServiceUsersNotFoundResponse: () => {
    let response = {
      errors: ['service not found']
    }
    return pactServices.withPactified(response)
  },

  validCreateServiceRequest: (opts) => {
    opts = opts || {}

    const data = {}
    if (opts.name) {
      data.name = opts.name
    }
    if (opts.gateway_account_ids) {
      data.gateway_account_ids = opts.gateway_account_ids
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validCreateServiceResponse: (opts) => {
    opts = opts || {}

    const externalId = opts.external_id || 'externalId'
    const serviceName = opts.name || 'System Generated'
    const gatewayAccountIds = opts.gateway_account_ids || []

    const data = {
      external_id: externalId,
      name: serviceName,
      gateway_account_ids: gatewayAccountIds
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validUpdateServiceNameRequest: (opts) => {
    opts = opts || {}

    const data = {
      op: 'replace',
      path: 'name',
      value: opts.name || 'updated-service-name'
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validUpdateServiceNameResponse: (opts) => {
    opts = opts || {}

    const externalId = opts.external_id || 'externalId'
    const serviceName = opts.name || 'updated-service-name'

    const data = {
      external_id: externalId,
      name: serviceName
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  badRequestWithInvalidPathWhenUpdateServiceNameRequest: (opts) => {
    opts = opts || {}

    const data = {
      op: 'replace',
      path: 'invalid-path',
      value: opts.name || 'updated-service-name'
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  badRequestResponseWhenNonNumericGatewayAccountIds: (nonNumericGatewayAccountIds) => {
    const responseData = _.map(nonNumericGatewayAccountIds, (field) => {
      return `Field [${field}] must contain numeric values`
    })
    const response = {
      errors: responseData
    }

    return pactServices.withPactified(response)
  },

  addGatewayAccountsRequest: (opts) => {
    opts = opts || {}
    opts.gatewayAccountIds = opts.gatewayAccountIds || ['666']

    const data = {
      op: 'add',
      path: 'gateway_account_ids',
      value: [].concat(opts.gatewayAccountIds)
    }

    return {
      getPactified: () => {
        return pactServices.pactify(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  }

}
