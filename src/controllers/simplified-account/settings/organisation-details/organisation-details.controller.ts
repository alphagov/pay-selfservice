import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { formatAddressAsParagraph } from '@utils/format-address-as-paragraph'

import * as edit from './edit-organisation-details.controller'

function get(req: ServiceRequest, res: ServiceResponse) {
  if (!req.service.merchantDetails) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.organisationDetails.edit,
        req.service.externalId,
        req.account.type
      )
    )
  }

  const organisationDetails = {
    organisationName: req.service.merchantDetails.name,
    address: formatAddressAsParagraph({
      line1: req.service.merchantDetails.addressLine1,
      line2: req.service.merchantDetails.addressLine2,
      city: req.service.merchantDetails.addressCity,
      postcode: req.service.merchantDetails.addressPostcode,
    }),
    telephoneNumber: req.service.merchantDetails.telephoneNumber,
    url: req.service.merchantDetails.url,
  }

  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails,
    editOrganisationDetailsHref: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.organisationDetails.edit,
      req.service.externalId,
      req.account.type
    ),
  }
  return response(req, res, 'simplified-account/settings/organisation-details/index', context)
}

module.exports = {
  get,
  edit,
}
