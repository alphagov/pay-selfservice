import {ServiceRequest, ServiceResponse} from "@utils/types/express";
import paths from "@root/paths"
import {response} from "@utils/response"
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import {validationResult} from "express-validator"
import {Errors, formatValidationErrors} from "@utils/simplified-account/format/format-validation-errors"
import Worldpay3dsFlexCredential from "@models/gateway-account-credential/Worldpay3dsFlexCredential.class"
import worldpayDetailsService from "@services/worldpay-details.service"
import { THREE_DS_FLEX_VALIDATION } from '@utils/simplified-account/validation/worldpay/validations.schema'
import _ from "lodash";
import {SESSION_KEY} from "@controllers/simplified-account/settings/worldpay-details/constants";

function get (req: ServiceRequest, res: ServiceResponse) {
  return response(req, res, 'simplified-account/settings/worldpay-details/flex-credentials', {
    credentials: {
      organisationalUnitId: req.account?.worldpay3dsFlex?.organisationalUnitId,
      issuer: req.account?.worldpay3dsFlex?.issuer
    },
    backLink: formatServiceAndAccountPathsFor(
      req.url.includes('switch-psp')
      ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
      : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type),
  })
}

interface WorldpayFlexCredentialsBody {
  organisationalUnitId: string
  issuer: string
  jwtMacKey: string
}

async function post (req: ServiceRequest<WorldpayFlexCredentialsBody>, res: ServiceResponse) {
  await Promise.all(THREE_DS_FLEX_VALIDATION.map(validation => validation.run(req)))
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    const formattedErrors = formatValidationErrors(validationErrors)
    return errorResponse(req, res, {
      summary: formattedErrors.errorSummary,
      formErrors: formattedErrors.formErrors
    })
  }

  const isSwitchingJourney = req.url.includes('switch-psp')

  const flexCredential = new Worldpay3dsFlexCredential()
    .withOrganisationalUnitId(req.body.organisationalUnitId)
    .withIssuer(req.body.issuer)
    .withJwtMacKey(req.body.jwtMacKey)

  const isValid = await worldpayDetailsService.check3dsFlexCredential(req.service.externalId, req.account.type, flexCredential)
  if (!isValid) {
    return errorResponse(req, res, {
      summary: [
        {
          text: 'Check your 3DS credentials, failed to link your account to Worldpay with credentials provided',
          href: '#organisational-unit-id'
        }
      ]
    })
  }

  await worldpayDetailsService.update3dsFlexCredentials(req.service.externalId, req.account.type, flexCredential)

  await worldpayDetailsService.updateIntegrationVersion3ds(req.service.externalId, req.account.type)

  _.set(req, SESSION_KEY, {
    TASK_COMPLETED: true,
  })

  return res.redirect(formatServiceAndAccountPathsFor(
    req.url.includes('switch-psp')
      ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
      : paths.simplifiedAccount.settings.worldpayDetails.index,
    req.service.externalId, req.account.type))
}

const errorResponse = (req: ServiceRequest<WorldpayFlexCredentialsBody>, res: ServiceResponse, errors: Errors) => {
  return response(req, res, 'simplified-account/settings/worldpay-details/flex-credentials', {
    errors,
    credentials: {
      organisationalUnitId: req.body.organisationalUnitId,
      issuer: req.body.issuer,
      jwtMacKey: req.body.jwtMacKey
    },
    backLink: formatServiceAndAccountPathsFor(
      req.url.includes('switch-psp')
      ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
      : paths.simplifiedAccount.settings.worldpayDetails.index,
      req.service.externalId, req.account.type),
  })
}

export {
  get,
  post
}
