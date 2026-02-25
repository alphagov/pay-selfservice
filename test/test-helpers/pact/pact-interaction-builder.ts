import { InteractionObject } from '@pact-foundation/pact'
import { HTTPMethod } from '@pact-foundation/pact/src/common/request'
import { Headers, Query } from '@pact-foundation/pact/src/dsl/interaction'
import { AnyTemplate, Matcher } from '@pact-foundation/pact/src/dsl/matchers'

class PactInteractionBuilder {
  url: string
  state: string
  method: HTTPMethod
  uponReceiving: string
  statusCode: number
  requestBody?: AnyTemplate
  responseBody?: AnyTemplate
  requestHeaders?: Headers
  responseHeaders?: Headers
  query?: Query
  withoutHeaders?: boolean

  constructor(url: string) {
    this.url = url
    this.state = 'default'
    this.method = 'GET'
    this.uponReceiving = 'a valid request'
    this.statusCode = 200
  }

  withRequestBody(body: AnyTemplate) {
    this.requestBody = body
    return this
  }

  withResponseBody(body: AnyTemplate) {
    this.responseBody = body
    return this
  }

  withResponseHeaders(headers: Headers) {
    this.responseHeaders = headers
    return this
  }

  withRequestHeaders(headers: Headers) {
    this.requestHeaders = headers
    return this
  }

  withStatusCode(statusCode: number) {
    this.statusCode = statusCode
    return this
  }

  withQuery(name: string, value: string | Matcher<string> | string[]) {
    this.query = this.query ?? {}
    // @ts-expect-error query should always be an object
    this.query[name] = value
    return this
  }

  withMethod(method: HTTPMethod) {
    this.method = method
    return this
  }

  withState(state: string) {
    this.state = state
    return this
  }

  withUponReceiving(uponReceiving: string) {
    this.uponReceiving = uponReceiving
    return this
  }

  withResponseWithoutHeaders() {
    this.withoutHeaders = true
    return this
  }

  build(): InteractionObject {
    const pact: InteractionObject = {
      state: this.state,
      uponReceiving: this.uponReceiving,
      withRequest: {
        method: this.method,
        path: this.url,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: this.statusCode,
        headers: { 'Content-Type': 'application/json' },
      },
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

    if (this.withoutHeaders) {
      delete pact.willRespondWith.headers
    }

    return pact
  }
}

export = { PactInteractionBuilder }
