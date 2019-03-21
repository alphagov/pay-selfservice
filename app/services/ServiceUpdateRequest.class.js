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
    email: 'merchant_details/email'
  }
}

const validOps = {
  add: 'add',
  replace: 'replace'
}

class ServiceUpdateRequestClass {
  constructor () {
    this.updates = []
  }

  addUpdate (op, path, value) {
    this.updates.push({
      op, path, value
    })
    return this
  }

  formatPayload () {
    return this.updates
  }
}

module.exports = { validPaths, validOps, ServiceUpdateRequest: ServiceUpdateRequestClass }
