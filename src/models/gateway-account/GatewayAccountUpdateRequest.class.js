class GatewayAccountUpdateRequest {
  constructor () {
    this.update = {}
    this.description = ''
  }

  replace () {
    return safeOperation('replace', this)
  }

  toJson () {
    return this.update
  }
}

const safeOperation = (op, request) => {
  return {
    integrationVersion3ds: (value) => {
      request.update = { op, path: 'integration_version_3ds', value }
      request.description = 'Update 3DS integration version'
      return request
    },

    emailCollectionMode: (value) => {
      request.update = { op, path: 'email_collection_mode', value }
      request.description = 'Update email collection mode'
      return request
    },

    allowGooglePay: (value) => {
      request.update = { op, path: 'allow_google_pay', value }
      request.description = 'Update allow google pay'
      return request
    },

    allowApplePay: (value) => {
      request.update = { op, path: 'allow_apple_pay', value }
      request.description = 'Update allow apple pay'
      return request
    },

    motoMaskCardNumber: (value) => {
      request.update = { op, path: 'moto_mask_card_number_input', value }
      request.description = 'Update moto mask card number setting'
      return request
    },

    motoMaskSecurityCode: (value) => {
      request.update = { op, path: 'moto_mask_card_security_code_input', value }
      request.description = 'Update moto mask security code setting'
      return request
    }
  }
}

module.exports = GatewayAccountUpdateRequest
