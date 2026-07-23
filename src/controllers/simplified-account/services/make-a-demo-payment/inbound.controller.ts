import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'
import createLogger from '@utils/logger'
import { Request, Response, NextFunction } from 'express'
import paths from '@root/paths'
import { getProductByExternalId } from '@services/products.service'
import { getGatewayAccountById } from '@services/gateway-accounts.service'
import formatSimplifiedAccountPathsFor from '@utils/simplified-account/format/format-simplified-account-paths-for'
import { Features } from '@root/config/features'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { ServiceRequestParams } from '@utils/types/express/ServiceRequest'

interface Params extends ServiceRequestParams {
  productExternalId: string
}


const logger = createLogger(__filename)

async function get(req: ServiceRequest<never, Params>, res: ServiceResponse, next: NextFunction) {
  const productExternalId = req.params.productExternalId
  try {
    const product = await getProductByExternalId(productExternalId)
    const account = await getGatewayAccountById(product.gatewayAccountId)

    const transactionsIndex = Features.isEnabled(Features.TRANSACTIONS)
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.transactions.index, account.serviceId, account.type)
      : formatAccountPathsFor(paths.account.transactions.index, account.externalId)

    res.redirect(302, transactionsIndex)
  } catch (err) {
    // ts compatability shim for pay-js-commons
    if (err instanceof RESTClientError) {
      const clientError = err as {
        errorCode: number
        message: string
      }
      logger.error('Failed to redirect demo payment to transactions', {
        error: clientError.message,
        error_code: clientError.errorCode,
      })
    } else {
      logger.error('Failed to redirect demo payment to transactions')
    }
    next(err)
  }
}

export { get }
