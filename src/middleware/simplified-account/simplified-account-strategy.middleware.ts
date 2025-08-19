import type { Request, Response, NextFunction } from 'express'
import { NotFoundError, NotAuthenticatedError } from '@root/errors'
import { keys } from '@root/paths'
import createLogger from '@utils/logger'
import User from '@models/user/User.class'
import { addField } from '@services/clients/base/request-context'
import _ from 'lodash'
// @ts-expect-error js commons is not updated for typescript support yet
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import Service from '@models/service/Service.class'
import { getGatewayAccountByServiceExternalIdAndType } from '@services/gateway-accounts.service'
const { SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, GATEWAY_ACCOUNT_EXTERNAL_ID } = keys

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
    return await getGatewayAccountByServiceExternalIdAndType(
      params.serviceExternalId,
      params.accountType
    )
  } catch (err) {
    // type assertion nastiness, js-commons is not yet ts-commons
    if (err instanceof RESTClientError) {
      const clientError = err as {
        errorCode: number,
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

// interface AuthenticatedRequest extends Request {
//   user: User
//   account?: GatewayAccount
//   service?: Service
//   params: Record<string, string>
// }

async function getSimplifiedAccount(req: Request, _: Response, next: NextFunction) {
  console.log('hit4')
  const request = req
  try {
    const serviceExternalId = request.params[SERVICE_EXTERNAL_ID]
    const accountType = request.params[ACCOUNT_TYPE]

    if (!serviceExternalId || !accountType) {
      return next(
        new NotFoundError('Could not resolve service external ID or gateway account type from request params')
      )
    }

    if (!request.user) {
      return next(new NotAuthenticatedError('User not found on request'))
    }

    const gatewayAccount = await getGatewayAccount(serviceExternalId, accountType)
    if (gatewayAccount) {
      request.account = gatewayAccount
      addField(GATEWAY_ACCOUNT_EXTERNAL_ID, gatewayAccount.externalId)
      addField(ACCOUNT_TYPE, gatewayAccount.type)
    } else {
      return next(new NotFoundError('Could not retrieve gateway account with provided parameters'))
    }
    const service = getService(request.user, serviceExternalId, gatewayAccount.id)
    if (service) {
      request.service = service
      addField(SERVICE_EXTERNAL_ID, service.externalId)
    } else {
      return next(new NotFoundError('Could not find role for user on service'))
    }
    next()
  } catch (err) {
    next(err)
  }
}

export = getSimplifiedAccount
