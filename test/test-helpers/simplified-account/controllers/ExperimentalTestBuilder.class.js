const sinon = require('sinon')
const _ = require('lodash')
const proxyquire = require('proxyquire')

class TestRequest {
  withUser (user) {
    this.user = user
    return this
  }

  withAccount (account) {
    this.account = account
    return this
  }

  withService (service) {
    this.service = service
    return this
  }

  withBody (body) {
    this.body = body
    return this
  }

  static copy (sourceRequest) {
    const newRequest = new TestRequest()
    newRequest
      .withAccount(sourceRequest.account)
      .withUser(sourceRequest.user)
      .withService(sourceRequest.service)
    return newRequest
  }
}

class TestResponse {
  withRedirectSpy () {
    this.redirect = sinon.spy()
    return this
  }
}

module.exports = class ExperimentalTestBuilder {
  constructor (controllerPath) {
    this.controllerPath = controllerPath
    this.next = sinon.spy()
    this.req = new TestRequest()
    this.res = new TestResponse()
      .withRedirectSpy()
  }

  withAccountType (type) {
    this.req.withAccount({ type })
    return this
  }

  withAccount (account) {
    this.req.withAccount(account)
    return this
  }

  withRequestBody (body) {
    this.req.withBody(body)
    return this
  }

  withServiceExternalId (serviceExternalId) {
    this.req.service.externalId = serviceExternalId
    return this
  }

  withService (service) {
    this.req.service = service
    return this
  }

  withStubs (stubs) {
    this.stubs = stubs
    return this
  }

  withReq (req) {
    this.req = new TestRequest()
      .withService(req.service)
      .withBody(req.body)
      .withAccount(req.account)
      .withUser(req.user)
    return this
  }

  withRes (res) {
    this.res = {
      ...res
    }
    return this
  }

  withNext (next) {
    this.next = next
    return this
  }

  build () {
    return new ControllerTest(
      this.controllerPath,
      this.req,
      this.res,
      this.next,
      this.stubs
    )
  }

  static copy (sourceTest) {
    return new ExperimentalTestBuilder(sourceTest.controllerPath)
      .withReq(sourceTest.req)
      .withRes(sourceTest.res)
      .withNext(sourceTest.next)
      .withStubs(sourceTest.stubs)
      // .build()
  }
}

class ControllerTest {
  constructor (controllerPath, req, res, next, stubs) {
    this.controllerPath = controllerPath
    this.controller = proxyquire(this.controllerPath, {
      ...stubs
    })

    this.req = req
    this.res = res
    this.next = next
    this.stubs = stubs
  }

  callMethod (method, recursive = false) {
    sinon.resetHistory()
    const controllerMethod = this.controller[method]
    return this.#call(controllerMethod, recursive)
  }

  call (recursive = false) {
    sinon.resetHistory()
    return this.#call(this.controller, recursive)
  }

  #call (method, recursive = false) {
    if (method instanceof Array && recursive) {
      return method.forEach(async subMethod => {
        await this._call(subMethod, recursive)
      })
    } else if (typeof method !== 'function') {
      throw new Error(`Method [${method}] is not a function`)
    }

    return method(this.req, this.res, this.next)
  }

  callMethodAtIndex (method, index, recursive = false) {
    sinon.resetHistory()
    const controllerMethod = this.controller[method][index]
    return this.#call(controllerMethod)
  }
}
