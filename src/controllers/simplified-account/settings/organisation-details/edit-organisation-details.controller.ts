import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { validationResult } from 'express-validator'
import formatValidationErrors from '@utils/simplified-account/format/format-validation-errors'
import _ from 'lodash'
import {
  ORGANISATION_DETAILS_VALIDATIONS,
  organisationDetailsSchema,
} from '@utils/simplified-account/validation/organisation-details.schema'
import { ServiceUpdateRequest } from '@models/service/ServiceUpdateRequest.class'
import { updateService } from '@services/service.service'
// @ts-expect-error js commons is not updated for typescript support yet
import { utils } from '@govuk-pay/pay-js-commons'

interface PayJsCommonsUtils {
  countries: {
    govukFrontendFormatted: (selectedCountry: string) => PayJsCommonsCountry[]
  }
}

interface PayJsCommonsCountry {
  selected: boolean
  value: string
  text: string
}

const { countries } = utils as PayJsCommonsUtils

function get(req: ServiceRequest, res: ServiceResponse) {
  const organisationDetails = {
    organisationName: req.service.merchantDetails?.name ?? '',
    addressLine1: req.service.merchantDetails?.addressLine1 ?? '',
    addressLine2: req.service.merchantDetails?.addressLine2 ?? '',
    addressCity: req.service.merchantDetails?.addressCity ?? '',
    addressPostcode: req.service.merchantDetails?.addressPostcode ?? '',
    addressCountry: req.service.merchantDetails?.addressCountry ?? '',
    telephoneNumber: req.service.merchantDetails?.telephoneNumber ?? '',
    organisationUrl: req.service.merchantDetails?.url ?? '',
  }
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails,
    submitLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.organisationDetails.edit,
      req.service.externalId,
      req.account.type
    ),
    countries: countries.govukFrontendFormatted(organisationDetails.addressCountry),
    backLink:
      req.service?.merchantDetails &&
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.organisationDetails.index,
        req.service.externalId,
        req.account.type
      ),
  }
  return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', context)
}

interface EditOrganisationDetailsBody {
  organisationName: string
  addressLine1: string
  addressLine2: string
  addressCity: string
  addressPostcode: string
  addressCountry: string
  telephoneNumber: string
  organisationUrl: string
}

async function post(req: ServiceRequest<EditOrganisationDetailsBody>, res: ServiceResponse) {
  await organisationDetailsSchema.organisationName.validate.run(req)
  await Promise.all(ORGANISATION_DETAILS_VALIDATIONS.map((validation) => validation.run(req)))

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)
    return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      organisationDetails: _.pick(req.body, [
        'organisationName',
        'addressLine1',
        'addressLine2',
        'addressCity',
        'addressPostcode',
        'telephoneNumber',
        'organisationUrl',
      ]),
      submitLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.organisationDetails.edit,
        req.service.externalId,
        req.account.type
      ),
      countries: countries.govukFrontendFormatted(req.body.addressCountry),
      backLink:
        req.service?.merchantDetails &&
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.organisationDetails.index,
          req.service.externalId,
          req.account.type
        ),
    })
  }

  const serviceUpdates = new ServiceUpdateRequest()
    .replace()
    .merchantDetails.name(req.body.organisationName)
    .replace()
    .merchantDetails.addressLine1(req.body.addressLine1)
    .replace()
    .merchantDetails.addressLine2(req.body.addressLine2)
    .replace()
    .merchantDetails.addressCity(req.body.addressCity)
    .replace()
    .merchantDetails.addressPostcode(req.body.addressPostcode)
    .replace()
    .merchantDetails.addressCountry(req.body.addressCountry)
    .replace()
    .merchantDetails.telephoneNumber(req.body.telephoneNumber)
    .replace()
    .merchantDetails.url(req.body.organisationUrl)
    .formatPayload()

  await updateService(req.service.externalId, serviceUpdates)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.organisationDetails.index,
      req.service.externalId,
      req.account.type
    )
  )
}
module.exports = {
  get,
  post,
}
