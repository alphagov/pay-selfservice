import { updateCustomParagraphByServiceIdAndAccountType } from '@services/email.service'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

async function post(req: ServiceRequest, res: ServiceResponse) {
  await updateCustomParagraphByServiceIdAndAccountType(req.service.externalId, req.account.type, '')
  req.flash('messages', { state: 'success', icon: '&check;', heading: 'Custom paragraph removed' })

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.emailNotifications.templates,
      req.service.externalId,
      req.account.type
    )
  )
}

export { post }
