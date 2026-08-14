import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import { AdyenTasks } from '@models/task-workflows/AdyenTasks.class'

function get(req: ServiceRequest, res: ServiceResponse) {
  const adyenTasks = AdyenTasks.forProviderSwitching(req.service, req.account)

  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-adyen/index.njk', {
    currentPsp: req.account.paymentProvider,
    adyenTasks,
  })
}

export { get }
