import paths from '@root/paths'
import urlJoin from '@utils/simplified-account/format/url'
import { formattedPathFor } from '@utils/simplified-account/format/format-path'

function formatServiceAndAccountPathsFor(
  path: string,
  serviceExternalId: string,
  accountType: string,
  ...params: string[]
) {
  const completePath = urlJoin(paths.simplifiedAccount.root, path)
  return formattedPathFor(completePath, serviceExternalId, accountType, ...params)
}

export = formatServiceAndAccountPathsFor
