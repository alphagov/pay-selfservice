type Operation = 'replace' | 'add'

interface Update {
  op: Operation
  value: string
  path: string
}

class ServiceUpdateRequest {
  updates: Update[]

  constructor() {
    this.updates = []
  }

  replace() {
    return safeOperation('replace', this)
  }

  add() {
    return safeOperation('add', this)
  }

  formatPayload() {
    return this.updates
  }
}

const safeOperation = (op: Operation, request: ServiceUpdateRequest) => {
  return {
    merchantDetails: {
      name: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/name' })
        return request
      },
      addressLine1: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/address_line1' })
        return request
      },
      addressLine2: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/address_line2' })
        return request
      },
      addressCity: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/address_city' })
        return request
      },
      addressPostcode: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/address_postcode' })
        return request
      },
      addressCountry: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/address_country' })
        return request
      },
      telephoneNumber: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/telephone_number' })
        return request
      },
      email: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/email' })
        return request
      },
      url: (value: string) => {
        request.updates.push({ op, value, path: 'merchant_details/url' })
        return request
      },
    },
    currentGoLiveStage: (value: string) => {
      request.updates.push({ op, value, path: 'current_go_live_stage' })
      return request
    },
    currentPspTestAccountStage: (value: string) => {
      request.updates.push({ op, value, path: 'current_psp_test_account_stage' })
      return request
    },
    takesPaymentsOverPhone: (value: string) => {
      request.updates.push({ op, value, path: 'takes_payments_over_phone' })
      return request
    },
  }
}
export { ServiceUpdateRequest }
