import { ServiceRequest, ServiceResponse } from '@utils/types/express'

function get (req: ServiceRequest, res: ServiceResponse) {
  return res.status(501).json({
    message: 'not implemented'
  })}

function post (req: ServiceRequest, res: ServiceResponse) {
  return res.status(501).json({
    message: 'not implemented'
  })
}

export {
  get,
  post
}
