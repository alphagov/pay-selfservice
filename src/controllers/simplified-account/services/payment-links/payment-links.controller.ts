import * as create from './create/create-payment-link.controller'
import * as edit from './edit/edit-payment-link.controller'
import * as remove from './delete/delete-payment-link.controller'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'

function get (req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/services/payment-links/index', {})
}

function post (req: ServiceRequest, res: ServiceResponse) {
  return res.status(501).json({
    message: 'not implemented'
  })
}

export {
  get,
  post,
  create,
  edit,
  remove
}
