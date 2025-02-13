const sinon = require('sinon')
const _ = require('lodash')
const proxyquire = require('proxyquire')

module.exports = class ControllerTestBuilder {
  constructor (controllerPath) {
    this.controllerPath = controllerPath
    this.next = sinon.spy()
    this.req = {
      service: {},
      account: {},
      user: {},
      query: {},
      flash: sinon.spy()
    }
    this.res = {
      redirect: sinon.spy(),
      json: sinon.spy()
    }
    this.nextReq = null
    this.nextRes = null
    this.nextStubsData = null
  }

  withAccountType (type) {
    this.req.account.type = type
    return this
  }

  withUser (user) {
    this.req.user = user
    return this
  }

  withAccount (account) {
    this.req.account = account
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

  nextRequest (params) {
    this.nextReq = _.merge({}, this.req, params)
    return this
  }

  nextResponse (params) {
    this.nextRes = _.merge({}, this.res, params)
    return this
  }

  nextStubs (stubs) {
    this.nextStubsData = stubs
    return this
  }

  build () {
    const controller = proxyquire(this.controllerPath, {
      ...this.stubs
    })
    return {
      req: this.req,
      res: this.res,
      next: this.next,
      nextRequest: this.nextRequest.bind(this),
      nextResponse: this.nextResponse.bind(this),
      nextStubs: this.nextStubs.bind(this),
      call: async (method, index) => {
        sinon.resetHistory() // ensure fresh mock data for each call
        if (this.nextStubsData) {
          Object.assign(this.stubs, this.nextStubsData) // copy by ref
          Object.assign(controller, proxyquire(this.controllerPath, {
            ...this.stubs
          }))
          this.nextStubsData = null
        }
        let fn
        if (method === undefined) {
          fn = index !== undefined ? controller[index] : controller
        } else {
          fn = index !== undefined ? controller[method][index] : controller[method]
        }
        if (typeof fn !== 'function') {
          throw new Error(`No function found for method '${method}'${index !== undefined ? ` at index ${index}` : ''}`)
        }
        const result = await fn(this.nextReq || this.req, this.nextRes || this.res, this.next)
        const currentReq = this.nextReq || this.req
        const currentRes = this.nextRes || this.res
        this.nextReq = this.nextRes = null
        return { result, req: currentReq, res: currentRes }
      }
    }
  }
}
