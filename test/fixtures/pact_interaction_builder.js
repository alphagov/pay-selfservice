class PactInteractionBuilder {
  constructor (url) {
    this.url = url
    this.state = 'default'
    this.method = 'GET'
    this.uponReceiving = 'a valid request'
    this.statusCode = 200
  }

  withRequestBody (body) {
    this.requestBody = body
    return this
  }

  withResponseBody (body) {
    this.responseBody = body
    return this
  }

  withResponseHeaders (headers) {
    this.responseHeaders = headers
    return this
  }

  withRequestHeaders (headers) {
    this.requestHeaders = headers
    return this
  }

  withStatusCode (statusCode) {
    this.statusCode = statusCode
    return this
  }

  withQuery (name, value) {
    this.query = this.query || {}
    this.query[name] = value
    return this
  }

  withMethod (method) {
    this.method = method
    return this
  }

  withState (state) {
    this.state = state
    return this
  }

  withUponReceiving (uponReceiving) {
    this.uponReceiving = uponReceiving
    return this
  }

  build () {
    let pact = {
      state: this.state,
      uponReceiving: this.uponReceiving,
      withRequest: {
        method: this.method,
        path: this.url,
        headers: {'Accept': 'application/json'}
      },
      willRespondWith: {
        status: this.statusCode,
        headers: {'Content-Type': 'application/json'}
      }
    }

    if (this.requestBody) {
      pact.withRequest.body = this.requestBody
    }

    if (this.query) {
      pact.withRequest.query = this.query
    }

    if (this.responseBody) {
      pact.willRespondWith.body = this.responseBody
    }

    if (this.requestHeaders) {
      pact.withRequest.headers = this.requestHeaders
    }

    if (this.responseHeaders) {
      pact.willRespondWith.headers = this.responseHeaders
    }

    return pact
  }
}

module.exports.PactInteractionBuilder = PactInteractionBuilder
