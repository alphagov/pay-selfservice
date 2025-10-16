import * as list from './transaction-list.controller'
import * as detail from './detail/transactions-detail.controller'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

function get(req: ServiceRequest, res: ServiceResponse) {
  return res.status(401).json({
    message: 'not implemented',
  })
}

export { get, detail, list }
