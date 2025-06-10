// @ts-expect-error js commons is not updated for typescript support yet
import { RESTClientError } from '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors'
import createLogger from '@utils/logger'
import { Request, Response, NextFunction } from 'express'
import formatAccountPathsFor from '@utils/format-account-paths-for'
import paths from '@root/paths'
import { getProductByExternalId } from '@services/products.service'
import { getGatewayAccountById } from '@services/gateway-accounts.service'

const logger = createLogger(__filename)

async function get(req: Request, res: Response, next: NextFunction) {
  const productExternalId = req.params.productExternalId
  try {
    const product = await getProductByExternalId(productExternalId)
    const account = await getGatewayAccountById(product.gatewayAccountId)
    res.redirect(302, formatAccountPathsFor(paths.account.transactions.index, account.externalId) as string)
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
