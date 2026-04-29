import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { NextFunction } from 'express'

function validateStatusFilter(req: ServiceRequest, _: ServiceResponse, next: NextFunction) {
  if (!['test', 'live'].includes(req.params.statusFilter)) {
    return next('route')
  }
  next()
}

export = validateStatusFilter
