import express from 'express'
import { NotFoundError } from '@root/errors'
import { ViewMode } from '@models/view-mode/ViewMode.class'
import { AuthenticatedRequest } from '@utils/types/express'

// for use on routes where determining if the user has services in the given mode is not required
// but it is required that the view mode is valid (test or live)
function validateModeFilter(
  req: AuthenticatedRequest & { viewMode: ViewMode },
  res: express.Response,
  next: express.NextFunction
) {
  if (req.params.modeFilter !== 'test' && req.params.modeFilter !== 'live') {
    throw new NotFoundError(`Invalid mode filter value [${req.params.modeFilter}]`)
  }

  return next()
}

// for use on routes where it is required that the user has services in the given mode
function viewModeStrategy(permission?: string) {
  return async function (
    req: AuthenticatedRequest & { viewMode: ViewMode },
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.params.modeFilter !== 'test' && req.params.modeFilter !== 'live') {
      throw new NotFoundError(`Invalid mode filter value [${req.params.modeFilter}]`)
    }

    req.viewMode = await ViewMode.forUser(req.user, req.params.modeFilter, permission)
    res.locals.viewMode = req.viewMode

    return next()
  }
}

export = { validateModeFilter, viewModeStrategy }
