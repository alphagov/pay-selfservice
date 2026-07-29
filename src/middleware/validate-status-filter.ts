import { AuthenticatedRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'

interface Params {
  statusFilter: string
}

function validateStatusFilter(req: AuthenticatedRequest<Params>, _: ServiceResponse, next: NextFunction) {
  if (!['test', 'live'].includes(req.params.statusFilter)) {
    return next('route')
  }
  next()
}

export = validateStatusFilter
