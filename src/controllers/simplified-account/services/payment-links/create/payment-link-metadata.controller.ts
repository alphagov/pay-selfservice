import { response } from '@utils/response'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

function get(req: ServiceRequest, res: ServiceResponse) {
    const { service, account } = req
    return response(req, res, 'placeholder', {
        service, 
        account
    })
}

export { get }