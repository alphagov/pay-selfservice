import { NextFunction, Request, Response } from 'express'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { Features } from '@root/config/features'
import formatPathFor from '@utils/replace-params-in-path'
import { NotFoundError } from '@root/errors'
import Ledger from '@services/clients/ledger.client'
import { userServicesContainsGatewayAccount } from '@utils/permissions'
import { TransactionData } from '@models/transaction/dto/Transaction.dto'
import { getGatewayAccountById } from '@services/gateway-accounts.service'
import Service from '@models/service/Service.class'
import { ServiceData } from '@models/service/dto/Service.dto'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { GatewayAccountData } from '@models/gateway-account/dto/GatewayAccount.dto'
import createLogger from '@utils/logger'

const logger = createLogger('transaction-redirect.middleware.ts')

export function transactionRedirect(path: string) {
  if (!Features.isEnabled(Features.TRANSACTIONS)) {
    return (req: Request, res: Response, next: NextFunction) => {
      return next()
    }
  }

  return (req: Request & { service?: unknown; account?: unknown }, res: Response) => {
    logger.info(`Transactions redirect called for path [${path}]`)

    const service = req.service instanceof Service ? req.service : new Service(req.service as ServiceData)
    const account =
      req.account instanceof GatewayAccount ? req.account : new GatewayAccount(req.account as GatewayAccountData)

    let redirectPath
    if (req.params.chargeId) {
      redirectPath = formatServiceAndAccountPathsFor(path, service.externalId, account.type, req.params.chargeId)
    } else {
      redirectPath = formatServiceAndAccountPathsFor(path, service.externalId, account.type)
    }

    logger.info(`Redirecting to ${redirectPath}`)
    return res.redirect(redirectPath)
  }
}

export function allServiceTransactionRedirect(path: string) {
  if (!Features.isEnabled(Features.TRANSACTIONS)) {
    return (req: Request, res: Response, next: NextFunction) => {
      return next()
    }
  }

  return (req: Request, res: Response) => {
    logger.info(`All service transactions redirect called for path [${path}]`)
    if (!req.params.statusFilter) {
      return res.redirect(formatPathFor(path, 'live'))
    }

    const redirectPath = formatPathFor(path, req.params.statusFilter)
    logger.info(`Redirecting to ${redirectPath}`)
    return res.redirect(redirectPath)
  }
}

export function allServiceTransactionDetailRedirect(path: string) {
  if (!Features.isEnabled(Features.TRANSACTIONS)) {
    return (req: Request, res: Response, next: NextFunction) => {
      return next()
    }
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    logger.info(`All service transactions detail redirect called for path [${path}]`)

    if (!req.params.chargeId) {
      throw new NotFoundError('Charge ID not found when attempting to redirect to all-service-transactions detail page')
    }

    let redirectPath
    try {
      const charge = (await Ledger.transactionWithAccountOverride(req.params.chargeId)) as TransactionData
      if (!userServicesContainsGatewayAccount(charge.gateway_account_id, req.user)) {
        return next(new NotFoundError('User does not have access to gateway account for transaction'))
      }
      const account = await getGatewayAccountById(charge.gateway_account_id as unknown as number)

      redirectPath = formatServiceAndAccountPathsFor(path, account.serviceId, account.type, req.params.chargeId)
    } catch (err) {
      if (err === 'NOT_FOUND') {
        return next(new NotFoundError('Transaction not found'))
      } else {
        return next(err)
      }
    }

    logger.info(`Redirecting to ${redirectPath}`)
    return res.redirect(redirectPath)
  }
}
