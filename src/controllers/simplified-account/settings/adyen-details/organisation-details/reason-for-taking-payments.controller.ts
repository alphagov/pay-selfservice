import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'
import { markTaskAsComplete } from '@services/adyen-setup.service'
import { adyenDetailsSchema } from '@utils/simplified-account/validation/adyen-details.schema'
import { validationResult } from 'express-validator'
import { formatValidationErrors } from '@utils/simplified-account/format'
import { OrganisationDetailsSession, GovernmentActivity } from './constants'
import { createOrganisation, createStore } from '@services/adyen-details.service'
import { getStripeStatementDescriptor } from '@services/stripe-details.service'
import { PaymentProvider } from '@models/constants/payment-provider'
import { InvalidConfigurationError } from '@root/errors'

interface ReasonForTakingPaymentsBody {
  governmentActivity: GovernmentActivity
}

function getBackLink(req: ServiceRequest<ReasonForTakingPaymentsBody>) {
  return formatServiceAndAccountPathsFor(
    paths.simplifiedAccount.settings.adyenDetails.organisationDetails.vatRegistration,
    req.service.externalId,
    req.account.type,
    req.account.getSwitchingCredential().externalId
  )
}

async function getStoreDetailsForStripeMigration(req: ServiceRequest<ReasonForTakingPaymentsBody>) {
  const telephoneNumber = req.service.merchantDetails?.telephoneNumber

  if (!telephoneNumber) {
    throw new InvalidConfigurationError(
      `No telephone number set in merchant details [service_external_id: ${req.service.externalId}]`
    )
  }

  const statementDescriptor = await getStripeStatementDescriptor(req.account)

  return { telephoneNumber, statementDescriptor }
}

function get(req: ServiceRequest, res: ServiceResponse) {
  const currentSession = OrganisationDetailsSession.extract(req)

  if (currentSession.isEmpty()) {
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
        req.service.externalId,
        req.account.type
      )
    )
  }

  return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
    backLink: getBackLink(req),
  })
}

async function post(req: ServiceRequest<ReasonForTakingPaymentsBody>, res: ServiceResponse) {
  const { account } = req
  const switchingCredentialId = account.getSwitchingCredential().externalId
  const currentSession = OrganisationDetailsSession.extract(req)

  const validations = [adyenDetailsSchema.selectGovernmentActivity.validate]

  await Promise.all(validations.map((validation) => validation.run(req)))
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = formatValidationErrors(errors)

    return response(req, res, 'simplified-account/settings/adyen-details/reason-for-taking-payments', {
      errors: {
        summary: formattedErrors.errorSummary,
        formErrors: formattedErrors.formErrors,
      },
      backLink: getBackLink(req),
    })
  }

  const completeSession = new OrganisationDetailsSession({
    ...currentSession,
  })

  const { governmentActivity } = req.body

  const storeDetails =
    req.account.paymentProvider === PaymentProvider.STRIPE ? await getStoreDetailsForStripeMigration(req) : undefined

  const { businessLine, balanceAccount } = await createOrganisation(
    completeSession,
    governmentActivity,
    req.service.name,
    req.service.externalId,
    req.account.type,
    switchingCredentialId,
    req.user.externalId
  )

  if (storeDetails) {
    await createStore({
      ...storeDetails,
      businessLineId: businessLine.id,
      balanceAccountId: balanceAccount.id,
      serviceName: req.service.name,
      organisationDetails: completeSession,
    })
  }

  await markTaskAsComplete(req.service.externalId, req.account.type, switchingCredentialId, 'organisationDetails')
  OrganisationDetailsSession.clear(req)

  return res.redirect(
    formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      req.service.externalId,
      req.account.type
    )
  )
}

export { get, post }
