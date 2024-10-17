'use strict'

const validPaths = {
  merchantDetails: {
    name: 'merchant_details/name',
    addressLine1: 'merchant_details/address_line1',
    addressLine2: 'merchant_details/address_line2',
    addressCity: 'merchant_details/address_city',
    addressPostcode: 'merchant_details/address_postcode',
    addressCountry: 'merchant_details/address_country',
    telephoneNumber: 'merchant_details/telephone_number',
    email: 'merchant_details/email',
    url: 'merchant_details/url'
  },
  currentGoLiveStage: 'current_go_live_stage',
  currentPspTestAccountStage: 'current_psp_test_account_stage',
  takesPaymentsOverPhone: 'takes_payments_over_phone'
}

const ops = {
  add: 'add',
  replace: 'replace'
}

class ServiceUpdateRequest {
  constructor () {
    this.updates = []
  }

  /**
   * Adds an update with op "replace" to the request
   * @param path
   * @param value
   */
  add (path, value) {
    this.updates.push({
      op: ops.add,
      path,
      value
    })
    return this
  }

  /**
   * Adds an update with op "add" to the request
   * @param path
   * @param value
   */
  replace (path, value) {
    this.updates.push({
      op: ops.replace,
      path,
      value
    })
    return this
  }

  formatPayload () {
    return this.updates
  }
}

module.exports = { validPaths, ServiceUpdateRequest }
