import type { Request, Response, NextFunction } from 'express'
import { NotFoundError, NotAuthenticatedError } from '@root/errors'
import * as LoggingKeys from '@govuk-pay/pay-js-commons/lib/logging/keys'
import createLogger from '@utils/logger'
import User from '@models/user/User.class'
import { addField } from '@services/clients/base/request-context'
import _ from 'lodash'
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import Service from '@models/service/Service.class'
import { getGatewayAccountByServiceExternalIdAndType } from '@services/gateway-accounts.service'
import { ServiceView } from '@models/service-view/ServiceView.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const GATEWAY_ACCOUNT_EXTERNAL_ID_LOGGING_KEY = 'gateway_account_external_id'

const logger = createLogger(__filename)

function getService(user: User, serviceExternalId: string, gatewayAccountId: number) {
  let service
  let matchedByExternalId
  const serviceRoles = _.get(user, 'serviceRoles', [])

  if (serviceRoles.length > 0 && serviceExternalId) {
    service = _.get(
      serviceRoles.find((serviceRole) => {
        const externalIdMatch = serviceRole.service.externalId === serviceExternalId
        if (externalIdMatch) {
          matchedByExternalId = serviceRole
          if (gatewayAccountId && !serviceRole.service.gatewayAccountIds.includes(`${gatewayAccountId}`)) {
            /*
          if you're here debugging this error message, it means that connector returned a gateway account for the
          serviceExtId/account type that adminusers does not know about and probably needs relinking
          */
            logger.warn(
              `Resolved gateway account is not present on service [service_external_id: ${serviceExternalId}, gateway_account_id: ${gatewayAccountId}]`
            )
            return false
          }
        }
        return externalIdMatch
      }) ?? matchedByExternalId,
      'service'
    )
  }

  return service
}

async function getGatewayAccount(serviceExternalId: string, accountType: string) {
  try {
    const params = {
      serviceExternalId,
      accountType,
    }
    return await getGatewayAccountByServiceExternalIdAndType(params.serviceExternalId, params.accountType)
  } catch (err) {
    // type assertion nastiness, js-commons is not yet ts-commons
    if (err instanceof RESTClientError) {
      const clientError = err as {
        errorCode: number
        message: string
      }
      const logContext = {
        error: clientError.message,
        error_code: clientError.errorCode,
      }

      if (clientError.errorCode === 404) {
        logger.info('Gateway account not found', logContext)
      } else {
        logger.error('Error retrieving gateway account', logContext)
      }
    } else {
      logger.error('Unknown error occurred while retrieving gateway account', err)
    }
  }
}

interface AuthenticatedRequest<P = never> extends Request<P> {
  user: User
  account?: GatewayAccount
  service?: Service
  serviceView?: ServiceView
}

interface Params {
  serviceExternalId: string
  accountType: string
}

async function getSimplifiedAccount(req: AuthenticatedRequest<Params>, _: Response, next: NextFunction) {
  try {
    const serviceExternalId = req.params.serviceExternalId
    const accountType = req.params.accountType

    if (invalidParams(serviceExternalId, accountType)) {
      return next(
        new NotFoundError('Could not resolve service external ID or gateway account type from request params')
      )
    }

    if (!req.user) {
      return next(new NotAuthenticatedError('User not found on request'))
    }

    const gatewayAccount = await getGatewayAccount(serviceExternalId, accountType)
    if (gatewayAccount) {
      req.account = gatewayAccount
      addField(GATEWAY_ACCOUNT_EXTERNAL_ID_LOGGING_KEY, gatewayAccount.externalId)
      addField(LoggingKeys.GATEWAY_ACCOUNT_TYPE, gatewayAccount.type)
    } else {
      return next(new NotFoundError('Could not retrieve gateway account with provided parameters'))
    }
    const service = getService(req.user, serviceExternalId, gatewayAccount.id)
    if (service) {
      req.service = service
      addField(LoggingKeys.SERVICE_EXTERNAL_ID, service.externalId)
    } else {
      return next(new NotFoundError('Could not find role for user on service'))
    }

    req.serviceView = ServiceView.determineFor(service, gatewayAccount)
    req.serviceView.showHeader = true
    next()
  } catch (err) {
    next(err)
  }

  function invalidParams(serviceExternalId: string, accountType: string) {
    return !serviceExternalId || !accountType || !Object.values(GatewayAccountType).includes(accountType.toLowerCase())
  }
}

export = getSimplifiedAccount
