'use strict'

class ServiceUpdateRequest {
  constructor () {
    this.updates = []
  }

  replace () {
    return safeOperation('replace', this)
  }

  add () {
    return safeOperation('add', this)
  }

  formatPayload () {
    return this.updates
  }
}

const safeOperation = (op, request) => {
  return {
    merchantDetails: {
      name: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/name' })
        return request
      },
      addressLine1: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/address_line1' })
        return request
      },
      addressLine2: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/address_line2' })
        return request
      },
      addressCity: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/address_city' })
        return request
      },
      addressPostcode: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/address_postcode' })
        return request
      },
      addressCountry: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/address_country' })
        return request
      },
      telephoneNumber: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/telephone_number' })
        return request
      },
      email: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/email' })
        return request
      },
      url: (value) => {
        request.updates.push({ op, value, path: 'merchant_details/url' })
        return request
      }
    },
    currentGoLiveStage: (value) => {
      request.updates.push({ op, value, path: 'current_go_live_stage' })
      return request
    },
    currentPspTestAccountStage: (value) => {
      request.updates.push({ op, value, path: 'current_psp_test_account_stage' })
      return request
    },
    takesPaymentsOverPhone: (value) => {
      request.updates.push({ op, value, path: 'takes_payments_over_phone' })
      return request
    }
  }
}
module.exports = { ServiceUpdateRequest }
