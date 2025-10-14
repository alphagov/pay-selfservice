import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import _ from 'lodash'
import { FORM_STATE_KEY } from '@controllers/simplified-account/settings/api-keys/create/constants'

function get(req: ServiceRequest, res: ServiceResponse) {
  const { details } = _.get(req, FORM_STATE_KEY, { details: {} })
  _.unset(req, FORM_STATE_KEY)
  if (_.isEmpty(details)) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.apiKeys.index,
        req.service.externalId,
        req.account.type
      )
    )
  }
  return response(req, res, 'simplified-account/settings/api-keys/create/new-api-key-details', {
    details,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

module.exports = {
  get,
}
