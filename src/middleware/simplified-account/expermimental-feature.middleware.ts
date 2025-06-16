import express from 'express'
import { NotFoundError } from '@root/errors'

const experimentalFeature = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const experimentFeaturesEnabledForEnvironment = process.env.EXPERIMENTAL_FEATURES_FLAG === 'true'
  if (!experimentFeaturesEnabledForEnvironment) {
    return next(new NotFoundError('Experimental features not enabled in this environment'))
  }
  next()
}

export = experimentalFeature

