import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import * as detail from './detail/transactions-detail.controller'

function get(req: ServiceRequest, res: ServiceResponse) {
  return res.status(401).json({
    message: 'not implemented',
  })
}

export { get, detail }
