import express from 'express'
import { NotFoundError } from '@root/errors'
import { Features } from '@root/config/experimental-features'

const experimentalFeatureMiddleware = (featureName: string) => {
  if (Features.isEnabled(featureName)) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => next()
  }
  return (req: express.Request, res: express.Response, next: express.NextFunction) =>
    next(new NotFoundError(`Feature ${featureName} is not enabled in this environment`))
}

export = experimentalFeatureMiddleware
