import { updateServiceName } from '@services/service.service'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import ServiceRequest from '@utils/types/express/ServiceRequest'
import ServiceResponse from '@utils/types/express/ServiceResponse'

async function post(req: ServiceRequest, res: ServiceResponse) {
  await updateServiceName(req.service.externalId, req.service.serviceName.en, '')
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Welsh service name removed' })
  res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.serviceName.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export = {
  post,
}
