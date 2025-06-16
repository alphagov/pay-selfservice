import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

function get (req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/services/payment-links/create/index', {})
}

function post (req: ServiceRequest, res: ServiceResponse) {
  return res.status(501).json({
    message: 'not implemented'
  })
}

export {
  get,
  post
}
