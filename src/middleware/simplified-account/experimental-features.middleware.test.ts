import sinon from 'sinon'
import express, { RequestHandler } from 'express'
import { NotFoundError } from '@root/errors'

process.env.EXPERIMENTAL_FEATURES_FLAG = 'feature_1,feature_2,feature_3'
const nextStub = sinon.stub()

let experimentalFeatureMiddleware: (featureNam: string) => RequestHandler

describe('experimental features middleware', () => {
  describe('for an enabled feature', () => {
    beforeEach(async () => {
      // @ts-expect-error it complains it can't find the module, idk why it clearly exists and works at runtime
      experimentalFeatureMiddleware = (await import('@middleware/simplified-account/experimental-feature.middleware'))
        .default as (featureNam: string) => RequestHandler
    })

    it('should call the next function with no arguments', async () => {
      const middleware = experimentalFeatureMiddleware('feature_1')

      await middleware({} as express.Request, {} as express.Response, nextStub)

      nextStub.should.have.been.calledOnce
      nextStub.should.have.been.calledWithExactly()
    })
  })

  describe('for a disabled feature', () => {
    it('should call the next function with an error', async () => {
      const middleware = experimentalFeatureMiddleware('feature_4')

      await middleware({} as express.Request, {} as express.Response, nextStub)

      nextStub.should.have.been.calledOnce
      sinon.assert.calledOnceWithMatch(
        nextStub,
        sinon.match
          .instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Feature [feature_4] is not enabled in this environment'))
      )
    })
  })
})
