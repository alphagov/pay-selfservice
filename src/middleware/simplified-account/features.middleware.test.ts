import sinon from 'sinon'
import express, { RequestHandler } from 'express'
import { NotFoundError } from '@root/errors'
import proxyquire from 'proxyquire'

const nextStub = sinon.stub()
const enabledStub = sinon.stub()

let featureMiddleware: (featureName: string) => RequestHandler

describe('experimental features middleware', () => {
  beforeEach(() => {
    featureMiddleware = proxyquire('@middleware/simplified-account/feature.middleware', {
      '@root/config/features': { Features: { isEnabled: enabledStub } },
    }) as (featureName: string) => RequestHandler
  })

  describe('for an enabled feature', () => {
    it('should call the next function with no arguments', async () => {
      enabledStub.returns(true)
      const middleware = featureMiddleware('enabled_feature')

      await middleware({} as express.Request, {} as express.Response, nextStub)

      nextStub.should.have.been.calledOnce
      nextStub.should.have.been.calledWithExactly()
    })
  })

  describe('for a disabled feature', () => {
    it('should call the next function with an error', async () => {
      enabledStub.returns(false)
      const middleware = featureMiddleware('disabled_feature')

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
