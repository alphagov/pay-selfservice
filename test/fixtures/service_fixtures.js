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
  validUpdateMerchantDetailsRequest: (opts) => {
    opts = opts || {}

    const data = {
      name: opts.name || 'updated-merchant-details-name',
      address_line1: opts.address_line1 || 'updated-merchant-details-addressline1',
      address_line2: opts.address_line2 || 'updated-merchant-details-addressline2',
      address_city: opts.address_city || 'updated-merchant-details-city',
      address_postcode: opts.address_postcode || 'updated-merchant-details-postcode',
      address_country: opts.address_country || 'updated-merchant-details-country'
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
  validUpdateMerchantDetailsResponse: (opts) => {
    opts = opts || {}
    const externalId = opts.external_id || 'externalId'
    const serviceName = opts.name || 'updated-service-name'
    const merchantDetails = opts.merchant_details || {}
    const merchantName = merchantDetails.name || 'updated-merchant-details-name'
    const merchantAddressLine1 = merchantDetails.address_line1 || 'updated-merchant-details-addressline1'
    const merchantAddressLine2 = merchantDetails.address_line2 || 'updated-merchant-details-addressline2'
    const merchantAddressCity = merchantDetails.address_city || 'updated-merchant-details-city'
    const merchantAddressPostcode = merchantDetails.address_postcode || 'updated-merchant-details-postcode'
    const merchantAddressCountry = merchantDetails.address_country || 'updated-merchant-details-country'

    const data = {
      external_id: externalId,
      name: serviceName,
      merchant_details: {
        name: merchantName,
        address_line1: merchantAddressLine1,
        address_line2: merchantAddressLine2,
        address_city: merchantAddressCity,
        address_postcode: merchantAddressPostcode,
        address_country: merchantAddressCountry
      }
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
  badRequestWhenMissingMandatoryMerchantDetails: (opts) => {
    opts = opts || {}

    const merchantName = opts.name || 'updated-merchant-details-name'
    const merchantAddressLine2 = opts.address_line2 || 'updated-merchant-details-addressline2'
    const merchantAddressCity = opts.address_city || 'updated-merchant-details-city'
    const merchantAddressPostcode = opts.address_postcode || 'updated-merchant-details-postcode'
    const merchantAddressCountry = opts.address_country || 'updated-merchant-details-country'

    const data = {
      merchant_details: {
        name: merchantName,
        address_line2: merchantAddressLine2,
        address_city: merchantAddressCity,
        address_postcode: merchantAddressPostcode,
        address_country: merchantAddressCountry
      }
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
  badResponseWhenMissingMandatoryMerchantDetails: () => {
    const responseData = [`Field [address_line1] is required`]
    const response = {
      errors: responseData
    }

    return pactServices.withPactified(response)
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
