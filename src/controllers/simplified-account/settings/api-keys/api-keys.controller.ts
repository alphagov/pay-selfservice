import { response } from '@utils/response'
import { getActiveTokens, getRevokedTokens } from '@services/tokens.service'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'

import * as create from './create'
import * as edit from './edit'
import * as revoke from './revoke'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const activeKeys = await getActiveTokens(`${req.account.id}`)
  const revokedKeys = await getRevokedTokens(`${req.account.id}`)
  const messages = res.locals?.flash?.messages ?? []
  return response(req, res, 'simplified-account/settings/api-keys/index', {
    messages,
    accountType: req.account.type,
    activeKeys: activeKeys.map((activeKey) => {
      return {
        ...activeKey,
        changeNameLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.apiKeys.edit.changeName,
          req.service.externalId,
          req.account.type,
          activeKey.tokenLink
        ),
        revokeKeyLink: formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.apiKeys.revoke.index,
          req.service.externalId,
          req.account.type,
          activeKey.tokenLink
        ),
      }
    }),
    createKeyLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.create.index,
      req.service.externalId,
      req.account.type
    ),
    revokedKeysLink: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.apiKeys.revoke.revokedKeys,
      req.service.externalId,
      req.account.type
    ),
    showRevokedKeysLink: revokedKeys.length > 0,
  })
}

export { get, create, edit, revoke }
