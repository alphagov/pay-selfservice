import { response } from '@utils/response'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { getRevokedTokens } from '@services/tokens.service'
import { NotFoundError } from '@root/errors'
import { NextFunction } from 'express'

async function get(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const revokedKeys = await getRevokedTokens(`${req.account.id}`)
  if (revokedKeys.length === 0) {
    return next(new NotFoundError(`No revoked keys found for gateway account [gateway_account_id: ${req.account.id}]`))
  }
  return response(req, res, 'simplified-account/settings/api-keys/revoke/revoked-keys', {
    tokens: revokedKeys,
    backLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.index,
      req.service.externalId,
      req.account.type
    ),
  })
}

export { get }
