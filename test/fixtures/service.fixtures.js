'use strict'

const lodash = require('lodash')

const buildServiceNameWithDefaults = (opts = {}) => {
  lodash.defaults(opts, {
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
  validCreateServiceRequest: (opts = {}) => {
    const data = {}
    if (opts.service_name) {
      data.service_name = buildServiceNameWithDefaults(opts.service_name)
    }
    return data
  },

  validUpdateServiceNameRequest: (opts = {}) => {
    lodash.defaults(opts, {
      en: 'new-en-name',
      cy: 'new-cy-name'
    })

    return [
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
  },

  addGatewayAccountsRequest: (gatewayAccountIds = ['666']) => {
    return {
      op: 'add',
      path: 'gateway_account_ids',
      value: gatewayAccountIds
    }
  },

  validCollectBillingAddressToggleRequest: (opts = {}) => {
    return {
      op: 'replace',
      path: 'collect_billing_address',
      value: opts.enabled || false
    }
  },

  validUpdateDefaultBillingAddressRequest: (countryCode) => {
    return {
      op: 'replace',
      path: 'default_billing_address_country',
      value: countryCode
    }
  },

  validUpdateRequestToGoLiveRequest: (value = 'AGREED_TO_STRIPE') => {
    return {
      op: 'replace',
      path: 'current_go_live_stage',
      value: value
    }
  },

  validUpdatePspTestAccountStage: (value) => {
    return {
      op: 'replace',
      path: 'current_psp_test_account_stage',
      value: value
    }
  },

  validUpdateMerchantDetailsRequest: (merchantDetails) => {
    return Object.keys(merchantDetails).map(key => {
      return {
        op: 'replace',
        path: `merchant_details/${key}`,
        value: merchantDetails[key]
      }
    })
  },

  validUpdateServiceRequest: (opts = {}) => {
    return {
      op: 'replace',
      path: opts.path,
      value: opts.value
    }
  },

  validServiceResponse: (opts = {}) => {
    lodash.defaults(opts, {
      id: 857,
      external_id: 'cp5wa',
      name: 'System Generated',
      gateway_account_ids: ['666'],
      service_name: {
        en: 'System Generated'
      },
      redirect_to_service_immediately_on_terminal_state: false,
      collect_billing_address: false,
      current_go_live_stage: 'NOT_STARTED',
      current_psp_test_account_stage: 'NOT_STARTED',
      agent_initiated_moto_enabled: false,
      takes_payments_over_phone: false,
      created_date: '2024-08-30'
    })

    const service = {
      id: opts.id,
      external_id: opts.external_id,
      name: opts.name,
      gateway_account_ids: opts.gateway_account_ids,
      service_name: buildServiceNameWithDefaults(opts.service_name),
      redirect_to_service_immediately_on_terminal_state: opts.redirect_to_service_immediately_on_terminal_state,
      collect_billing_address: opts.collect_billing_address,
      current_go_live_stage: opts.current_go_live_stage,
      experimental_features_enabled: true,
      current_psp_test_account_stage: opts.current_psp_test_account_stage,
      agent_initiated_moto_enabled: opts.agent_initiated_moto_enabled,
      takes_payments_over_phone: opts.takes_payments_over_phone,
      created_date: opts.created_date
    }

    if (opts.merchant_details) {
      service.merchant_details = lodash.pick(opts.merchant_details, [
        'name',
        'address_line1',
        'address_line2',
        'address_city',
        'address_postcode',
        'address_country',
        'email',
        'telephone_number',
        'url'
      ])
    }

    if (opts.default_billing_address_country !== null) {
      service.default_billing_address_country = opts.default_billing_address_country === undefined
        ? 'GB' : opts.default_billing_address_country
    }

    return service
  }
}
