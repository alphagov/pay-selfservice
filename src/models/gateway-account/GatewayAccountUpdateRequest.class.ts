type EmailCollectionMode = 'MANDATORY' | 'OPTIONAL' | 'OFF'
type Operation = 'replace'

interface Update {
  op: Operation,
  path: string,
  value: number | boolean | EmailCollectionMode
}

class GatewayAccountUpdateRequest {
  public update: Update | null
  public description: string

  constructor() {
    this.update = null
    this.description = ''
  }

  replace() {
    return safeOperation('replace', this)
  }

  toJson() {
    if (!this.update) {
      throw new Error('called without update')
    }
    return this.update
  }
}

const safeOperation = (op: Operation, request: GatewayAccountUpdateRequest) => {
  return {
    integrationVersion3ds: (value: number) => {
      request.update = { op, path: 'integration_version_3ds', value }
      request.description = 'Update 3DS integration version'
      return request
    },

    emailCollectionMode: (value: EmailCollectionMode) => {
      request.update = { op, path: 'email_collection_mode', value }
      request.description = 'Update email collection mode'
      return request
    },

    allowGooglePay: (value: boolean) => {
      request.update = { op, path: 'allow_google_pay', value }
      request.description = 'Update allow google pay'
      return request
    },

    allowApplePay: (value: boolean) => {
      request.update = { op, path: 'allow_apple_pay', value }
      request.description = 'Update allow apple pay'
      return request
    },

    motoMaskCardNumber: (value: boolean) => {
      request.update = { op, path: 'moto_mask_card_number_input', value }
      request.description = 'Update moto mask card number setting'
      return request
    },

    motoMaskSecurityCode: (value: boolean) => {
      request.update = { op, path: 'moto_mask_card_security_code_input', value }
      request.description = 'Update moto mask security code setting'
      return request
    }
  }
}

export = GatewayAccountUpdateRequest
