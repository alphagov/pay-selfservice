import sinon from 'sinon'
import express, { RequestHandler } from 'express'
import { NotFoundError } from '@root/errors'
import proxyquire from 'proxyquire'

const nextStub = sinon.stub()
const enabledStub = sinon.stub()

let experimentalFeatureMiddleware: (featureName: string) => RequestHandler

describe('experimental features middleware', () => {
  beforeEach(() => {
    experimentalFeatureMiddleware = proxyquire('@middleware/simplified-account/experimental-feature.middleware', {
      '@root/config/experimental-features': { Features: { isEnabled: enabledStub } },
    }) as (featureName: string) => RequestHandler
  })

  describe('for an enabled feature', () => {
    it('should call the next function with no arguments', async () => {
      enabledStub.returns(true)
      const middleware = experimentalFeatureMiddleware('enabled_feature')

      await middleware({} as express.Request, {} as express.Response, nextStub)

      nextStub.should.have.been.calledOnce
      nextStub.should.have.been.calledWithExactly()
    })
  })

  describe('for a disabled feature', () => {
    it('should call the next function with an error', async () => {
      enabledStub.returns(false)
      const middleware = experimentalFeatureMiddleware('disabled_feature')

      await middleware({} as express.Request, {} as express.Response, nextStub)

      nextStub.should.have.been.calledOnce
      sinon.assert.calledOnceWithMatch(
        nextStub,
        sinon.match
          .instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Feature [disabled_feature] is not enabled in this environment'))
      )
    })
  })
})
