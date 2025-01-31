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
      request.description = 'Set the 3DS integration version to use when authorising with the gateway'
      return request
    },

    emailCollectionMode: (value) => {
      request.update = { op, path: 'email_collection_mode', value }
      request.description = 'update email collection mode'
      return request
    }
  }
}

module.exports = GatewayAccountUpdateRequest
