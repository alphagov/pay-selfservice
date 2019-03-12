'use strict'

// NPM dependencies
const path = require('path')
const _ = require('lodash')

// Custom dependencies
const pactBase = require(path.join(__dirname, '/pact_base'))

// Global setup
const pactServices = pactBase({ array: ['service_ids'] })

const buildServiceNameWithDefaults = (opts = {}) => {
  _.defaults(opts, {
    en: 'System Generated'
  })

  const serviceName = {
    en: opts.en
  }
  if (opts.cy !== undefined) {
    serviceName.cy = opts.cy
  }

  return serviceName
}

module.exports = {
  /**
   * @param invites Array params override get invites for service response
   * @return {{getPactified: (function()) Pact response, getPlain: (function()) request with overrides applied}}
   */
  validListInvitesForServiceResponse: (invites) => {
    const data = invites || [{
      email: 'esdfkjh@email.test',
      telephone_number: '',
      disabled: false,
      role: 'admin',
      expired: false,
      user_exist: false,
      attempt_counter: 0
    }]
    return {
      getPactified: () => {
        return pactServices.pactifyNestedArray(data)
      },
      getPlain: () => {
        return data
      }
    }
  },
  validCreateServiceRequest: (opts) => {
    opts = opts || {}

    const data = {}
    if (opts.name) {
      data.name = opts.name
      data.service_name = { en: opts.name }
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

  validUpdateServiceNameRequest: (opts = {}) => {
    _.defaults(opts, {
      en: 'new-en-name',
      cy: 'new-cy-name'
    })

    const data = [
      {
        op: 'replace',
        path: 'service_name/en',
        value: opts.en
      },
      {
        op: 'replace',
        path: 'service_name/cy',
        value: opts.cy
      }
    ]

    return {
      getPactified: () => {
        return pactServices.pactifyNestedArray(data)
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

  addGatewayAccountsRequest: (gatewayAccountIds = ['666']) => {
    const data = {
      op: 'add',
      path: 'gateway_account_ids',
      value: gatewayAccountIds
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

  validCollectBillingAddressToggleRequest: (opts) => {
    opts = opts || {}

    const data = {
      op: 'replace',
      path: 'collect_billing_address',
      value: opts.enabled || false
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

  validUpdateRequestToGoLiveRequest: (value = 'AGREED_TO_STRIPE') => {
    const data = {
      op: 'replace',
      path: 'current_go_live_stage',
      value: value
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

  validUpdateMerchantNameRequest: (value) => {
    const data = {
      op: 'replace',
      path: 'merchant_details/name',
      value: value
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

  validUpdateServiceRequest: (opts) => {
    opts = opts || {}

    const data = {
      op: 'replace',
      path: opts.path,
      value: opts.value
    }

    return {
      getPactified: () => {
        return pactServices.pactifySimpleArray(data)
      },
      getPlain: () => {
        return _.clone(data)
      }
    }
  },

  validServiceResponse: (opts = {}) => {
    _.defaults(opts, {
      id: 857,
      external_id: 'cp5wa',
      name: 'System Generated',
      gateway_account_ids: ['666'],
      service_name: {
        en: 'System Generated'
      },
      redirect_to_service_immediately_on_terminal_state: false,
      collect_billing_address: false,
      current_go_live_stage: 'NOT_STARTED'
    })

    const service = {
      id: opts.id,
      external_id: opts.external_id,
      name: opts.name,
      gateway_account_ids: opts.gateway_account_ids,
      service_name: buildServiceNameWithDefaults(opts.service_name),
      redirect_to_service_immediately_on_terminal_state: opts.redirect_to_service_immediately_on_terminal_state,
      collect_billing_address: opts.collect_billing_address,
      current_go_live_stage: opts.current_go_live_stage
    }

    if (opts.merchant_details) {
      service.merchant_details = _.pick(opts.merchant_details, [
        'name',
        'address_line1',
        'address_line2',
        'address_city',
        'address_postcode',
        'address_country',
        'email',
        'telephone_number'
      ])
    }

    return {
      getPactified: () => {
        return pactServices.pactify(service)
      },
      getPlain: () => {
        return _.clone(service)
      }
    }
  }
}
